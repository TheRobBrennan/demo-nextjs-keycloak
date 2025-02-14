const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function createTunnel(port, name) {
    console.log(`📡 Creating tunnel for ${name} (port ${port})...`);

    const maxRetries = 10;
    const baseDelay = 3000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            process.stdout.write(`\r🔄 Attempt ${attempt + 1}/${maxRetries}`);
            const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

            const url = await new Promise((resolve, reject) => {
                let timer = 0;
                const loadingInterval = setInterval(() => {
                    timer++;
                    process.stdout.write(`\r⏳ Waiting for tunnel... ${timer}s`);
                }, 1000);

                tunnel.stderr.on('data', (data) => {
                    const error = data.toString();

                    // Look for the URL in the formatted box
                    if (error.includes('Your quick Tunnel has been created!')) {
                        const urlMatch = error.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
                        if (urlMatch) {
                            clearInterval(loadingInterval);
                            console.log(''); // Clean line
                            resolve({ tunnel, url: urlMatch[0] });
                            return;
                        }
                    }

                    // Only log actual errors
                    if (error.includes('ERR') && !error.includes('Thank you for trying')) {
                        console.error(`\n❌ Tunnel error:`, error);
                    }

                    if (error.includes('429 Too Many Requests')) {
                        clearInterval(loadingInterval);
                        reject(new Error('Rate limit hit'));
                    }
                });

                tunnel.on('close', (code) => {
                    clearInterval(loadingInterval);
                    if (code !== 0) {
                        reject(new Error(`${name} tunnel exited with code ${code}`));
                    }
                });

                setTimeout(() => {
                    clearInterval(loadingInterval);
                    reject(new Error('Tunnel creation timeout'));
                }, 30000);
            });

            console.log(`✅ ${name} tunnel created at ${url.url}`);
            return url;
        } catch (error) {
            const delay = baseDelay * Math.pow(2, attempt);
            const seconds = delay / 1000;
            process.stdout.write(`\r❌ Failed. Cooling down for ${seconds}s...`);

            for (let i = seconds; i > 0; i--) {
                process.stdout.write(`\r⏰ ${i}s remaining...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('');
        }
    }

    throw new Error(`💥 Failed to create tunnel for ${name} after ${maxRetries} attempts`);
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
        await initializeKeycloak(keycloakUrl, nextjsUrl);

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