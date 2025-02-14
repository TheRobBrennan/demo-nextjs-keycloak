const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');

// Ensure the .env.local file exists with correct values
const envContent = `KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
KEYCLOAK_ISSUER="https://tdr-keycloak.loca.lt/realms/tdr"
NEXTAUTH_URL="https://tdr-nextjs.loca.lt"
NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="`;

fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);

// Start Docker services
const docker = spawn('docker', ['compose', 'up', '-d']);

docker.on('close', async (code) => {
    if (code !== 0) {
        console.error('Docker compose failed to start');
        process.exit(1);
    }

    console.log('Starting tunnels...');
    // Start tunnels with retries if subdomain is taken
    const maxRetries = 3;
    let retryCount = 0;

    async function startTunnels() {
        try {
            const services = spawn('npx', [
                'concurrently',
                '-n', 'keycloak-tunnel,nextjs-tunnel',
                '-c', 'yellow,green',
                'lt --port 8080 --subdomain tdr-keycloak --local-host localhost',
                'lt --port 3000 --subdomain tdr-nextjs --local-host localhost'
            ], {
                stdio: 'inherit',
                shell: true
            });

            services.on('error', async (error) => {
                console.error('Failed to start services:', error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying tunnel creation (attempt ${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    startTunnels();
                } else {
                    console.error('Failed to create tunnels after multiple attempts');
                    process.exit(1);
                }
            });

            return services;
        } catch (error) {
            throw error;
        }
    }

    const services = await startTunnels();

    // Wait for tunnels to be ready
    console.log('Waiting for tunnels to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        // Initialize Keycloak with roles and users
        await initializeKeycloak();

        // Start Next.js development server
        const nextApp = spawn('next', ['dev'], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_OPTIONS: '--dns-result-order=ipv4first'
            }
        });

        // Handle errors
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