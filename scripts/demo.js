const { spawn } = require('child_process');
const fs = require('fs');
const initializeKeycloak = require('./init-keycloak');
const prettyMilliseconds = require('pretty-ms').default;

// Check if terminal-notifier is installed, if not, try to install it
try {
    execSync('which terminal-notifier');
} catch (error) {
    console.log('📱 Installing terminal-notifier...');
    try {
        execSync('brew install terminal-notifier');
    } catch (brewError) {
        console.log('⚠️  Could not install terminal-notifier. Notifications will be disabled.');
    }
}

// Test notification using terminal-notifier directly
try {
    execSync('terminal-notifier -title "Tunnel Demo" -message "Starting tunnel creation process..." -sound default');
    console.log('🔔 Test notification sent');
} catch (error) {
    console.log('⚠️  Could not send notification:', error.message);
}

async function createTunnel(port, name) {
    console.log(`📡 Creating tunnel for ${name} (port ${port})...`);

    const maxRetries = 15;
    const baseDelay = 15000;
    const timeFormatOptions = {
        secondsDecimalDigits: 0,
        millisecondsDecimalDigits: 0
    };

    if (global.lastTunnelCreation) {
        const timeSinceLastTunnel = Date.now() - global.lastTunnelCreation;
        const minimumGap = 10000;

        if (timeSinceLastTunnel < minimumGap) {
            const waitTime = minimumGap - timeSinceLastTunnel;
            console.log(`\n⏳ Waiting ${prettyMilliseconds(waitTime, timeFormatOptions)} before creating next tunnel...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            process.stdout.write(`\r🔄 Attempt ${attempt + 1}/${maxRetries}`);
            const tunnel = spawn('cloudflared', [
                'tunnel',
                '--url',
                `http://127.0.0.1:${port}`,
                '--no-autoupdate'
            ]);

            const url = await new Promise((resolve, reject) => {
                let timer = 0;
                const loadingInterval = setInterval(() => {
                    timer++;
                    process.stdout.write(`\r⏳ Waiting for tunnel... ${prettyMilliseconds(timer * 1000, timeFormatOptions)}`);
                }, 1000);

                tunnel.stderr.on('data', (data) => {
                    const error = data.toString();

                    if (error.includes('Your quick Tunnel has been created!')) {
                        const urlMatch = error.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
                        if (urlMatch) {
                            clearInterval(loadingInterval);
                            console.log(''); // Clean line
                            global.lastTunnelCreation = Date.now();
                            resolve({ tunnel, url: urlMatch[0] });
                            return;
                        }
                    }

                    if (error.includes('429 Too Many Requests')) {
                        clearInterval(loadingInterval);
                        console.log('\n⚠️  Rate limit hit, cooling down...');
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
            const delay = baseDelay * Math.pow(4, attempt);

            if (attempt + 1 < maxRetries) {
                console.log(`\n🕐 Cooling down for ${prettyMilliseconds(delay, timeFormatOptions)} (attempt ${attempt + 1}/${maxRetries})`);

                // Show countdown with bell character for audio feedback
                const startTime = Date.now();
                const endTime = startTime + delay;

                while (Date.now() < endTime) {
                    const remaining = endTime - Date.now();
                    process.stdout.write(`\r⏰ ${prettyMilliseconds(remaining, timeFormatOptions)} remaining...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                // Add a bell character when resuming
                process.stdout.write('\u0007\n');
                console.log('\n🔄 Resuming tunnel creation...');
            }
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