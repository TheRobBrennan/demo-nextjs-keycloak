const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the .env.local file exists with correct values
const envContent = `KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
KEYCLOAK_ISSUER="https://tdr-keycloak.loca.lt/realms/tdr"
NEXTAUTH_URL="https://tdr-nextjs.loca.lt"
NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="`;

fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);

// Start Docker services
const docker = spawn('docker', ['compose', 'up', '-d']);

docker.on('close', (code) => {
    if (code !== 0) {
        console.error('Docker compose failed to start');
        process.exit(1);
    }

    // Start all services using concurrently
    const services = spawn('npx', [
        'concurrently',
        '-n', 'next,keycloak-tunnel,nextjs-tunnel',
        '-c', 'blue,yellow,green',
        '"NODE_OPTIONS=--dns-result-order=ipv4first next dev"',
        '"lt --port 8080 --subdomain tdr-keycloak"',
        '"lt --port 3000 --subdomain tdr-nextjs"'
    ], {
        stdio: 'inherit',
        shell: true
    });

    services.on('error', (error) => {
        console.error('Failed to start services:', error);
        process.exit(1);
    });
});

// Handle script termination
process.on('SIGINT', () => {
    spawn('docker', ['compose', 'down'], { stdio: 'inherit' });
    process.exit();
}); 