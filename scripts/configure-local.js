const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function configureLocal() {
    try {
        console.log('🔧 Configuring local Keycloak...');

        // Local Keycloak URL
        const keycloakUrl = 'http://localhost:8080';

        // Initialize Keycloak with our configuration
        await initializeKeycloak(keycloakUrl);

        console.log('✅ Local Keycloak configured successfully!');
        console.log('\nYou can now:');
        console.log('1. Access Keycloak admin: http://localhost:8080/admin');
        console.log('   Username: admin');
        console.log('   Password: admin');
        console.log('\n2. Start Next.js:');
        console.log('   npm run dev');

    } catch (error) {
        console.error('❌ Configuration failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

configureLocal().catch(console.error); 