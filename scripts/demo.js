const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function createTunnel(port, name) {
    console.log(`\n📡 Creating tunnel for ${name} (port ${port})...`);

    const maxRetries = 10;
    const baseDelay = 3000; // 3 seconds base delay

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`\n🔄 Attempt ${attempt + 1}/${maxRetries}`);
            const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

            // Create a promise that resolves with the tunnel URL
            const url = await new Promise((resolve, reject) => {
                let timer = 0;
                const loadingInterval = setInterval(() => {
                    timer++;
                    console.log(`\n⏳ Waiting for tunnel... ${timer}s`);
                }, 1000);

                tunnel.stdout.on('data', (data) => {
                    const output = data.toString();
                    const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
                    if (match) {
                        clearInterval(loadingInterval);
                        resolve({ tunnel, url: match[0] });
                    }
                });

                tunnel.stderr.on('data', (data) => {
                    const error = data.toString();
                    if (error.includes('429 Too Many Requests')) {
                        clearInterval(loadingInterval);
                        reject(new Error('Rate limit hit'));
                    }
                    console.error(`${name}: ${error}`);
                });

                tunnel.on('close', (code) => {
                    clearInterval(loadingInterval);
                    if (code !== 0) {
                        reject(new Error(`${name} tunnel exited with code ${code}`));
                    }
                });
            });

            console.log(`\n✅ ${name} tunnel created at ${url.url}`);
            return url;
        } catch (error) {
            const delay = baseDelay * Math.pow(2, attempt);
            const seconds = delay / 1000;
            console.log(`\n❌ Failed. Cooling down for ${seconds}s...`);

            // Show countdown
            for (let i = seconds; i > 0; i--) {
                process.stdout.write(`\r⏰ ${i}s remaining...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('\n');
        }
    }

    throw new Error(`\n💥 Failed to create tunnel for ${name} after ${maxRetries} attempts`);
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