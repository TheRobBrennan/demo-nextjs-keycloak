# Using Ngrok as Backup Tunnel Service

This guide explains how to use ngrok as an alternative to Cloudflare tunnels.

## Setup

1. **Install ngrok**
   ```bash
   # Using npm
   npm install -g ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Sign up and connect**
   - Create free account at https://ngrok.com
   - Get your authtoken from dashboard
   - Connect your token:
     ```bash
     ngrok authtoken your-token-here
     ```

## Creating Tunnels

1. **Start your services first**
   ```bash
   docker compose up -d
   npm run dev
   ```

2. **Create tunnels** (in separate terminals)
   ```bash
   # For Next.js
   ngrok http 3000

   # For Keycloak
   ngrok http 8080
   ```

3. **Copy URLs**
   - Note both URLs from ngrok output
   - They'll look like: `https://xxxx-xx-xx-xxx-xx.ngrok.io`

## Update Environment

Create/update `.env.local`:
```bash
KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="your-client-secret"
KEYCLOAK_ISSUER="https://[keycloak-ngrok-url]/realms/tdr"
NEXTAUTH_URL="https://[nextjs-ngrok-url]"
NEXTAUTH_SECRET="your-secret"
```

## Configure Keycloak

1. Access Keycloak admin console at:
   `https://[keycloak-ngrok-url]/admin`

2. Update client settings:
   - Valid redirect URIs: `https://[nextjs-ngrok-url]/*`
   - Web origins: `https://[nextjs-ngrok-url]`

## Notes

- Free ngrok accounts allow:
  - 1 tunnel at a time (need 2 terminals)
  - 40 connections/minute
  - Random URLs (they change each time)
- URLs change each time you restart ngrok
- Consider upgrading for static URLs

## Troubleshooting

1. If URLs don't work:
   - Check both tunnels are running
   - Ensure environment variables match ngrok URLs
   - Restart Next.js after URL changes

2. If Keycloak login fails:
   - Verify redirect URIs in Keycloak
   - Check environment variables
   - Ensure both tunnels are active 