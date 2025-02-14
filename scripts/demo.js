const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function createTunnel(port, name) {
    console.log(`Creating tunnel for ${name} (port ${port})...`);

    const tunnel = spawn('cloudflared', [
        'tunnel',
        '--url',
        `http://localhost:${port}`,
        '--metrics',
        'localhost:808' + (port === 8080 ? '1' : '2')
    ], {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Get the assigned URL by checking the metrics endpoint
    const url = await new Promise((resolve, reject) => {
        // Give cloudflared a moment to start
        setTimeout(async () => {
            try {
                const response = await axios.get(`http://localhost:808${port === 8080 ? '1' : '2'}/metrics`);
                const metrics = response.data;
                const urlMatch = metrics.match(/tunnel_url="(https:\/\/[^"]+)"/);
                if (urlMatch && urlMatch[1]) {
                    console.log(`${name} tunnel created at: ${urlMatch[1]}`);
                    resolve(urlMatch[1]);
                } else {
                    reject(new Error('Could not find tunnel URL in metrics'));
                }
            } catch (error) {
                reject(error);
            }
        }, 3000);

        tunnel.stderr.on('data', (data) => {
            console.error(`${name} tunnel error:`, data.toString());
        });

        tunnel.on('error', reject);
        tunnel.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Tunnel exited with code ${code}`));
        });
    });

    return { tunnel, url };
}

// Start Docker services
const docker = spawn('docker', ['compose', 'up', '-d']);

docker.on('close', async (code) => {
    if (code !== 0) {
        console.error('Docker compose failed to start');
        process.exit(1);
    }

    try {
        console.log('Starting tunnels...');
        const { url: keycloakUrl } = await createTunnel(8080, 'Keycloak');
        const { url: nextjsUrl } = await createTunnel(3000, 'NextJS');

        // Create .env.local with the actual URLs
        console.log('Creating .env.local with tunnel URLs...');
        const envContent = `KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
KEYCLOAK_ISSUER="${keycloakUrl}/realms/tdr"
NEXTAUTH_URL="${nextjsUrl}"
NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="`;

        fs.writeFileSync('.env.local', envContent);

        // Initialize Keycloak with the dynamic URL
        console.log('Initializing Keycloak...');
        await initializeKeycloak(keycloakUrl);

        // Start Next.js development server
        console.log('Starting Next.js...');
        const nextApp = spawn('next', ['dev'], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_OPTIONS: '--dns-result-order=ipv4first'
            }
        });

        nextApp.on('error', (error) => {
            console.error('Failed to start Next.js:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed during setup:', error);
        process.exit(1);
    }
});

// Handle script termination
process.on('SIGINT', () => {
    spawn('docker', ['compose', 'down'], { stdio: 'inherit' });
    process.exit();
}); 