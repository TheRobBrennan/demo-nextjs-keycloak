const axios = require('axios');
const qs = require('querystring');

async function initializeKeycloak(keycloakUrl, nextjsUrl) {
    try {
        // Get initial token and wait for Keycloak to be ready
        const token = await waitForKeycloak(keycloakUrl);
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Create TDR realm if it doesn't exist
        console.log('Creating TDR realm...');
        try {
            await axios.post(`${keycloakUrl}/admin/realms`, {
                realm: 'tdr',
                enabled: true,
                displayName: 'TDR Realm'
            }, { headers, timeout: 5000 });
        } catch (error) {
            if (error.response?.status !== 409) { // 409 means realm already exists
                throw error;
            }
        }

        // Create client if it doesn't exist
        console.log('Creating client...');
        const clientConfig = {
            clientId: 'nextjs',
            protocol: 'openid-connect',
            publicClient: false,
            authorizationServicesEnabled: true,
            serviceAccountsEnabled: true,
            standardFlowEnabled: true,
            frontchannelLogout: true,
            backchannelLogout: false,
            attributes: {
                "post.logout.redirect.uris": "+",
                "pkce.code.challenge.method": "S256"
            },
            redirectUris: [
                `${nextjsUrl}/*`,
                `${nextjsUrl}/api/auth/callback/keycloak`,
                `${nextjsUrl}/`
            ],
            webOrigins: [nextjsUrl]
        };

        try {
            await axios.post(`${keycloakUrl}/admin/realms/tdr/clients`, clientConfig, { headers, timeout: 5000 });
        } catch (error) {
            if (error.response?.status !== 409) { // 409 means client already exists
                throw error;
            }
        }

        // Create roles
        console.log('Creating roles...');
        const roles = ['system-admin', 'researcher'];
        for (const role of roles) {
            try {
                await axios.post(`${keycloakUrl}/admin/realms/tdr/roles`, {
                    name: role,
                    description: `${role} role`,
                    composite: false,
                    clientRole: false
                }, { headers, timeout: 5000 });
                console.log(`Created ${role} role`);
            } catch (error) {
                if (error.response?.status !== 409) {
                    throw error;
                }
                console.log(`${role} role already exists`);
            }
        }

        // Create and configure users with roles
        const users = [
            {
                username: 'sysadmin',
                password: 'sysadmin',
                roles: ['system-admin'],
                firstName: 'Justasystem',
                lastName: 'Administrator'
            },
            {
                username: 'researcher',
                password: 'researcher',
                roles: ['researcher'],
                firstName: 'Awellregarded',
                lastName: 'Researcher'
            }
        ];

        for (const user of users) {
            console.log(`Creating/updating ${user.username} user...`);
            let userId;
            try {
                const createResponse = await axios.post(`${keycloakUrl}/admin/realms/tdr/users`, {
                    username: user.username,
                    enabled: true,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    credentials: [{
                        type: 'password',
                        value: user.password,
                        temporary: false
                    }]
                }, { headers });
                userId = createResponse.headers.location.split('/').pop();
            } catch (error) {
                if (error.response?.status === 409) {
                    // User exists, get their ID
                    const usersResponse = await axios.get(
                        `${keycloakUrl}/admin/realms/tdr/users?username=${user.username}`,
                        { headers }
                    );
                    userId = usersResponse.data[0].id;
                } else {
                    throw error;
                }
            }

            // Get all realm roles
            const rolesResponse = await axios.get(
                `${keycloakUrl}/admin/realms/tdr/roles`,
                { headers }
            );

            // Find and assign the specified roles
            for (const roleName of user.roles) {
                const role = rolesResponse.data.find(r => r.name === roleName);
                if (role) {
                    await axios.post(
                        `${keycloakUrl}/admin/realms/tdr/users/${userId}/role-mappings/realm`,
                        [role],
                        { headers }
                    );
                    console.log(`Assigned ${roleName} role to ${user.username}`);
                }
            }
        }

        console.log('Keycloak initialization complete!');
    } catch (error) {
        console.error('Error initializing Keycloak:', error.response?.data || error.message);
        throw error;
    }
}

async function waitForKeycloak(keycloakUrl) {
    console.log('Waiting for Keycloak container to start...');

    const maxAttempts = 60;
    const delay = 3000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            console.log(`Attempt ${attempts + 1}/${maxAttempts} - Checking Keycloak status...`);

            // Try to get the admin token as a test of readiness
            const tokenResponse = await axios.post(
                `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
                'grant_type=password&client_id=admin-cli&username=admin&password=admin',
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 5000
                }
            );

            if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
                console.log('Keycloak is ready!');
                return tokenResponse.data.access_token;
            }
        } catch (error) {
            attempts++;
            if (error.response) {
                console.log(`Response status: ${error.response.status}`);
            } else if (error.request) {
                console.log('No response received');
            } else {
                console.log('Error:', error.message);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Keycloak failed to start after maximum attempts');
}

async function waitForPort(url) {
    const maxAttempts = 30;
    const delay = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(url);
            if (response.status === 200) {
                console.log(`Service at ${url} is ready!`);
                return;
            }
        } catch (error) {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts} - Waiting for ${url}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`Service at ${url} failed to start`);
}

async function getAdminToken(keycloakUrl) {
    const response = await axios.post(
        `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
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

async function createRoleIfNotExists(roleName, token, keycloakUrl) {
    try {
        await axios.get(
            `${keycloakUrl}/admin/realms/tdr/roles/${roleName}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            await axios.post(
                `${keycloakUrl}/admin/realms/tdr/roles`,
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

async function createUserIfNotExists(userData, token, keycloakUrl) {
    try {
        // Check if user exists
        const response = await axios.get(
            `${keycloakUrl}/admin/realms/tdr/users?username=${userData.username}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data.length === 0) {
            // Create user
            const createResponse = await axios.post(
                `${keycloakUrl}/admin/realms/tdr/users`,
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
                    `${keycloakUrl}/admin/realms/tdr/roles/${roleName}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                await axios.post(
                    `${keycloakUrl}/admin/realms/tdr/users/${userId}/role-mappings/realm`,
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

async function createRealmIfNotExists(token, keycloakUrl) {
    try {
        await axios.get(
            `${keycloakUrl}/admin/realms/tdr`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            await axios.post(
                `${keycloakUrl}/admin/realms`,
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

async function createClientIfNotExists(token, keycloakUrl) {
    const CLIENT_SECRET = "WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"; // Matching our .env.local

    try {
        await axios.get(
            `${keycloakUrl}/admin/realms/tdr/clients/nextjs`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
    } catch (error) {
        if (error.response?.status === 404) {
            // Create the client
            const createResponse = await axios.post(
                `${keycloakUrl}/admin/realms/tdr/clients`,
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
                    baseUrl: 'https://tdr-nextjs.loca.lt',
                    secret: CLIENT_SECRET  // Set the specific client secret
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