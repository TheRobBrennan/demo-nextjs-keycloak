const axios = require('axios');
const qs = require('querystring');

async function initializeKeycloak() {
    try {
        console.log('Waiting for Keycloak to be ready...');
        await waitForKeycloak();

        const KEYCLOAK_URL = 'https://tdr-keycloak.loca.lt';
        console.log('Getting admin token...');
        const ADMIN_TOKEN = await getAdminToken();

        // Create realm if it doesn't exist
        console.log('Creating TDR realm...');
        await createRealmIfNotExists(ADMIN_TOKEN);

        // Create client if it doesn't exist
        console.log('Creating NextJS client...');
        await createClientIfNotExists(ADMIN_TOKEN);

        // Create roles if they don't exist
        console.log('Creating roles...');
        await createRoleIfNotExists('system-admin', ADMIN_TOKEN);
        await createRoleIfNotExists('researcher', ADMIN_TOKEN);

        // Create users if they don't exist
        const users = [
            {
                username: 'sysadmin',
                firstName: 'Justasystem',
                lastName: 'Administrator',
                email: 'sysadmin@mail.com',
                password: 'sysadmin',
                roles: ['system-admin']
            },
            {
                username: 'researcher',
                firstName: 'Awellregarded',
                lastName: 'Researcher',
                email: 'researcher@mail.com',
                password: 'researcher',
                roles: ['researcher']
            }
        ];

        console.log('Creating users...');
        for (const user of users) {
            await createUserIfNotExists(user, ADMIN_TOKEN);
        }

        console.log('Keycloak initialization complete!');
    } catch (error) {
        console.error('Failed to initialize Keycloak:', error.message);
        process.exit(1);
    }
}

async function waitForKeycloak() {
    const maxAttempts = 30;
    const delay = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            await axios.get('https://tdr-keycloak.loca.lt/health');
            return;
        } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Keycloak failed to start');
}

async function getAdminToken() {
    const response = await axios.post(
        'https://tdr-keycloak.loca.lt/realms/master/protocol/openid-connect/token',
        qs.stringify({
            grant_type: 'password',
            client_id: 'admin-cli',
            username: 'admin',
            password: 'admin'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    return response.data.access_token;
}

async function createRoleIfNotExists(roleName, token) {
    try {
        await axios.get(
            `https://tdr-keycloak.loca.lt/admin/realms/tdr/roles/${roleName}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            await axios.post(
                'https://tdr-keycloak.loca.lt/admin/realms/tdr/roles',
                {
                    name: roleName,
                    description: `${roleName} role`
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }
}

async function createUserIfNotExists(userData, token) {
    try {
        // Check if user exists
        const response = await axios.get(
            `https://tdr-keycloak.loca.lt/admin/realms/tdr/users?username=${userData.username}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data.length === 0) {
            // Create user
            const createResponse = await axios.post(
                'https://tdr-keycloak.loca.lt/admin/realms/tdr/users',
                {
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    enabled: true,
                    credentials: [{
                        type: 'password',
                        value: userData.password,
                        temporary: false
                    }]
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Get user ID from Location header
            const userId = createResponse.headers.location.split('/').pop();

            // Assign roles
            for (const roleName of userData.roles) {
                const roleResponse = await axios.get(
                    `https://tdr-keycloak.loca.lt/admin/realms/tdr/roles/${roleName}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                await axios.post(
                    `https://tdr-keycloak.loca.lt/admin/realms/tdr/users/${userId}/role-mappings/realm`,
                    [roleResponse.data],
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
        }
    } catch (error) {
        console.error(`Failed to create user ${userData.username}:`, error.message);
        throw error;
    }
}

async function createRealmIfNotExists(token) {
    try {
        await axios.get(
            'https://tdr-keycloak.loca.lt/admin/realms/tdr',
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            await axios.post(
                'https://tdr-keycloak.loca.lt/admin/realms',
                {
                    realm: 'tdr',
                    enabled: true,
                    displayName: 'TDR Demo Realm'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }
}

async function createClientIfNotExists(token) {
    try {
        await axios.get(
            'https://tdr-keycloak.loca.lt/admin/realms/tdr/clients/nextjs',
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            await axios.post(
                'https://tdr-keycloak.loca.lt/admin/realms/tdr/clients',
                {
                    clientId: 'nextjs',
                    enabled: true,
                    protocol: 'openid-connect',
                    publicClient: false,
                    authorizationServicesEnabled: false,
                    serviceAccountsEnabled: false,
                    standardFlowEnabled: true,
                    redirectUris: ['https://tdr-nextjs.loca.lt/api/auth/callback/keycloak'],
                    webOrigins: ['https://tdr-nextjs.loca.lt'],
                    rootUrl: 'https://tdr-nextjs.loca.lt',
                    baseUrl: 'https://tdr-nextjs.loca.lt'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }
}

module.exports = initializeKeycloak; 