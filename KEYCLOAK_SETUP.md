# Keycloak Setup Guide for Next.js Authentication

## 1. Create a New Realm
1. Log into Keycloak Admin Console
2. Click "Create Realm"
3. Name it (e.g., "tdr")
4. Click "Create"

## 2. Create Client
1. Go to "Clients" in the left sidebar
2. Click "Create client"
3. Fill in the details:
   ```
   Client type: OpenID Connect
   Client ID: nextjs
   ```
4. Click "Next"
5. Configure client settings:
   ```
   Client authentication: ON
   Authorization: OFF
   ```
6. Click "Next" and "Save"

## 3. Configure Client Settings
1. Go to the "Settings" tab
2. Update the following:
   ```
   Root URL: http://localhost:3000
   Home URL: http://localhost:3000
   Valid redirect URIs: http://localhost:3000/api/auth/callback/keycloak
   Valid post logout redirect URIs: http://localhost:3000
   Web origins: http://localhost:3000
   ```
3. Click "Save"

## 4. Configure Client Scopes
1. Go to the "Client scopes" tab
2. Verify these default scopes are present:
   ```
   roles
   email
   profile
   web-origins
   ```
3. Click on "nextjs-dedicated" scope
4. Go to "Mappers" tab
5. Create new mapper:
   ```
   Name: client roles
   Mapper type: User Client Role
   Client ID: nextjs
   Token Claim Name: resource_access.${client_id}.roles
   Claim JSON Type: String
   Add to ID token: ON
   Add to access token: ON
   Add to userinfo: ON
   ```

## 5. Create Roles
1. Go to "Roles" in the left sidebar for realm roles
   OR
   Go to "Clients" → "nextjs" → "Roles" for client roles
2. Click "Create role"
3. Create desired roles (e.g., "system-admin")

## 6. Create Test User
1. Go to "Users" in the left sidebar
2. Click "Add user"
3. Fill in required fields:
   ```
   Username: testuser
   Email: test@example.com
   Email verified: ON
   ```
4. Click "Create"
5. Go to "Credentials" tab
6. Set password and disable temporary password

## 7. Assign Roles to User
1. Go to "Users" → Select your user
2. Go to "Role mappings" tab
3. For realm roles:
   - Select role from "Realm roles" dropdown
   - Click "Assign"
4. For client roles:
   - Select "nextjs" from "Client roles" dropdown
   - Select desired roles
   - Click "Assign"

## 8. Get Client Credentials
1. Go to "Clients" → "nextjs"
2. Go to "Credentials" tab
3. Copy the "Client secret"

## 9. Environment Variables
Create `.env.local` in your Next.js project:

```sh
KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="your-client-secret"
KEYCLOAK_ISSUER="http://localhost:8080/realms/tdr"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret" # Generate with: openssl rand -base64 32
```

## Verification Steps
1. Start your Next.js application
2. Visit http://localhost:3000
3. Click login
4. You should be redirected to Keycloak
5. After successful login, you should see your roles displayed


