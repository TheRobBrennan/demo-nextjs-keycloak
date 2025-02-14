const { spawn } = require('child_process');
const fs = require('fs');
const initializeKeycloak = require('./init-keycloak');

// Import pretty-ms properly
let prettyMs;
import('pretty-ms').then(module => {
    prettyMs = module.default;
});

function createProgressBar(current, total, width = 35) {
    const progress = Math.round((current / total) * width);
    const bars = '█'.repeat(progress) + '▒'.repeat(width - progress);
    const percent = Math.round((current / total) * 100).toString().padStart(3, ' ');
    return `${bars} ${percent}%`;
}

async function createTunnel(port, name) {
    // Ensure prettyMs is loaded
    if (!prettyMs) {
        await import('pretty-ms').then(module => {
            prettyMs = module.default;
        });
    }

    const width = 45; // Standard width for all sections
    console.log('\n🌐 TUNNEL SETUP');
    console.log('═'.repeat(width));
    console.log('Waiting for system to stabilize...');
    console.log('Creating secure tunnels...\n');

    console.log(`🎯 Target: ${name} (port ${port})`);
    console.log('═'.repeat(width));

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
            console.log(`⏳ Initial cooldown: ${prettyMs(waitTime, timeFormatOptions)}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log('\n┌' + '─'.repeat(width - 2) + '┐');
            console.log(`│  📡 Attempt ${(attempt + 1).toString().padStart(2, '0')} of ${maxRetries}${' '.repeat(22)}│`);
            console.log(`│  ${createProgressBar(attempt + 1, maxRetries)} │`);
            console.log('└' + '─'.repeat(width - 2) + '┘');

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
                    const dots = '.'.repeat(timer % 4);
                    process.stdout.write(`\r  ⏳ Creating tunnel${dots.padEnd(3)} ${prettyMs(timer * 1000, timeFormatOptions)}`);
                }, 1000);

                tunnel.stderr.on('data', (data) => {
                    const error = data.toString();

                    if (error.includes('Your quick Tunnel has been created!')) {
                        const urlMatch = error.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
                        if (urlMatch) {
                            clearInterval(loadingInterval);
                            console.log('\n  ✨ Tunnel created successfully!');
                            global.lastTunnelCreation = Date.now();
                            resolve({ tunnel, url: urlMatch[0] });
                            return;
                        }
                    }

                    if (error.includes('429 Too Many Requests')) {
                        clearInterval(loadingInterval);
                        console.log('\n  ⚠️  Rate limit detected');
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

            console.log(`\n  🔗 URL: ${url.url}`);
            console.log('═'.repeat(50));
            return url;
        } catch (error) {
            const delay = baseDelay * Math.pow(4, attempt);

            if (attempt + 1 < maxRetries) {
                console.log('\n  ⏳ Cooling down...');
                console.log(`  📊 Progress: ${attempt + 1}/${maxRetries} attempts\n`);

                // Show countdown with progress bar
                const startTime = Date.now();
                const endTime = startTime + delay;

                while (Date.now() < endTime) {
                    const elapsed = Date.now() - startTime;
                    const remaining = endTime - Date.now();

                    const progressBar = createProgressBar(elapsed, delay);
                    const remainingTime = prettyMs(remaining, timeFormatOptions);
                    process.stdout.clearLine(0);
                    process.stdout.cursorTo(0);
                    process.stdout.write(`  ${progressBar} ${remainingTime} remain`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                console.log('\n');
                process.stdout.write('\u0007'); // Bell sound
            }
        }
    }

    throw new Error(`💥 Failed to create tunnel for ${name} after ${maxRetries} attempts`);
}

// Main function to handle Docker startup
async function main() {
    console.log('\n📦 DOCKER SERVICES\n' + '='.repeat(50));
    console.log('Starting Docker containers...');
    const docker = spawn('docker', ['compose', 'up', '-d']);

    // Handle both stdout and stderr properly
    docker.stdout.on('data', (data) => {
        // Split into lines and trim each line
        data.toString().split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(line => console.log(line));
    });

    docker.stderr.on('data', (data) => {
        // Split into lines, trim each line, and filter empty lines
        data.toString().split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(line => {
                if (!line.includes('Creating') &&
                    !line.includes('Starting') &&
                    !line.includes('Created') &&
                    !line.includes('Started') &&
                    !line.includes('Running')) {
                    console.error(line);
                } else {
                    console.log(line);
                }
            });
    });

    await new Promise((resolve, reject) => {
        docker.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Docker compose failed with code ${code}`));
            } else {
                resolve();
            }
        });
    });

    console.log('✅ All Docker services started successfully\n');

    // Add a small delay to ensure any lingering tunnels are fully cleaned up
    console.log('\n🌐 TUNNEL SETUP\n' + '='.repeat(50));
    console.log('Waiting for system to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        console.log('Creating secure tunnels...');
        const { url: keycloakUrl } = await createTunnel(8080, 'Keycloak');
        const { url: nextjsUrl } = await createTunnel(3000, 'NextJS');

        console.log('\n⚙️  ENVIRONMENT SETUP\n' + '='.repeat(50));
        console.log('Creating .env.local with tunnel URLs...');
        const envContent = `KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
KEYCLOAK_ISSUER="${keycloakUrl}/realms/tdr"
NEXTAUTH_URL="${nextjsUrl}"
NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="`;

        fs.writeFileSync('.env.local', envContent);

        console.log('\n🔐 KEYCLOAK CONFIGURATION\n' + '='.repeat(50));
        console.log('Initializing Keycloak...');
        await initializeKeycloak(keycloakUrl, nextjsUrl);

        console.log('\n🚀 STARTING NEXTJS\n' + '='.repeat(50));
        console.log('Launching development server...');
        const nextApp = spawn('next', ['dev'], {
            stdio: 'inherit'
        });

        nextApp.on('error', (error) => {
            console.error('Failed to start Next.js:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('\n❌ ERROR\n' + '='.repeat(50));
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('\n❌ FATAL ERROR\n' + '='.repeat(50));
    console.error('Fatal error:', error);
    process.exit(1);
}); 