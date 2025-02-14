# NextJS + Keycloak Demo Guide

This guide walks through setting up and running the Next.js + Keycloak demo with external access using local tunnels.

## ⚠️ Important Notes About Tunnels

Cloudflare has strict rate limits on tunnel creation:
- 1 request per second per IP
- Cooldown period may be required between attempts
- May need to wait 15-30 minutes if rate limited

### Backup Options
If tunnels aren't working:

1. **Local-only Demo**
   ```bash
   # Start services
   docker compose up -d
   npm run dev

   # Access via:
   - Next.js: http://localhost:3000
   - Keycloak: http://localhost:8080
   ```

2. **Alternative Tunnel Service**
   - Install ngrok: `npm install -g ngrok`
   - Create tunnels:
     ```bash
     ngrok http 3000  # for Next.js
     ngrok http 8080  # for Keycloak
     ```

3. **Best Practices**
   - Start setup 30 minutes before demo time
   - Test tunnel creation early
   - Keep local-only demo ready as backup
   - Document both URLs when working

## Quick Start

If you want to get started immediately, run:

```bash
npm run demo
```

This command will:
- Set up required environment variables
- Start Docker services (Keycloak and Postgres)
- Launch Next.js development server
- Create secure tunnels for external access

## Prerequisites

Before starting the demo, ensure you have:
- Node.js 16 or higher
- Docker and Docker Compose
- Git
- Cloudflared
  - macOS users with Homebrew: `brew install cloudflared`
  - Other platforms: Follow the [official installation guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

You can verify your installations with:

```bash
node --version
docker --version
docker compose version
git --version
cloudflared --version
```

## Manual Setup Steps

If you prefer to understand or run each step manually:

1. **Clone and Install**
   ```bash
   git clone https://github.com/TheRobBrennan/demo-nextjs-keycloak.git
   cd demo-nextjs-keycloak
   npm install
   ```

2. **Environment Setup**
   Create `.env.local` with:
   ```plaintext
   KEYCLOAK_CLIENT_ID="nextjs"
   KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
   KEYCLOAK_ISSUER="https://tdr-keycloak.loca.lt/realms/tdr"
   NEXTAUTH_URL="https://tdr-nextjs.loca.lt"
   NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="
   ```

3. **Start Services**
   ```bash
   # Start Keycloak and Postgres
   docker compose up -d

   # In separate terminals:
   lt --port 8080 --subdomain tdr-keycloak
   lt --port 3000 --subdomain tdr-nextjs
   NODE_OPTIONS='--dns-result-order=ipv4first' npm run dev
   ```

## Keycloak Configuration

Once services are running:

1. Access Keycloak admin console:
   - URL: https://tdr-keycloak.loca.lt/admin
   - Username: `admin`
   - Password: `admin`

2. Configure the Next.js client:
   - Navigate to: Clients → nextjs → Settings
   - Update URLs:
     ```plaintext
     Root URL: https://tdr-nextjs.loca.lt
     Home URL: https://tdr-nextjs.loca.lt
     Valid redirect URIs: https://tdr-nextjs.loca.lt/api/auth/callback/keycloak
     Valid post logout redirect URIs: https://tdr-nextjs.loca.lt
     Web origins: https://tdr-nextjs.loca.lt
     ```

## Access Points

After setup, your services are available at:
- Next.js App: https://tdr-nextjs.loca.lt
- Keycloak Admin: https://tdr-keycloak.loca.lt/admin

## Demo Scripts

This project includes several scripts to help you run and manage the demo:

### `npm run demo`
The standard demo script that:
- Starts Docker containers
- Creates tunnels
- Configures Keycloak
- Launches Next.js

### `npm run demo:build`
A clean-slate version that:
- Removes existing Docker containers and volumes
- Deletes any existing .env.local
- Removes existing node_modules
- Performs fresh npm install
- Runs complete demo setup
Use this when you want to start completely fresh or if you're having issues.

### `npm run demo:clean`
Cleanup script that:
- Stops all running tunnels
- Removes Docker containers and volumes
- Deletes .env.local
- Cleans up temporary files
Use this to completely reset your environment.

## Troubleshooting

If you encounter issues:
1. Try `npm run demo:clean` followed by `npm run demo:build`
2. Check if cloudflared is installed and running properly
3. Ensure all ports (3000, 8080, 5432) are available
4. Look for error messages in the console output

## Cleanup

To stop all services:

```bash
# If using demo script:
Ctrl+C in the terminal

# If running manually:
docker compose down
rm .env.local
```

## Additional Notes

- The demo script uses `concurrently` to manage multiple processes
- Local tunnels provide secure HTTPS access
- All services are configured to work together automatically
- The demo environment is for development purposes only