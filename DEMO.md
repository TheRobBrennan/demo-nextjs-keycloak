# NextJS + Keycloak Demo Guide

This guide walks through setting up and running the Next.js + Keycloak demo with external access using local tunnels.

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

You can verify your installations with:

```bash
node --version
docker --version
docker compose version
git --version
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

## Troubleshooting

### Tunnel Disconnections
If tunnels disconnect:
- Stop the demo script (Ctrl+C)
- Run `npm run demo` again

### DNS Issues
If you encounter DNS-related errors:
- The demo script includes `--dns-result-order=ipv4first` flag
- Try restarting the demo script
- Check your internet connection

### Login Problems
If unable to log in:
1. Verify Keycloak client settings match tunnel URLs
2. Check browser console for CORS errors
3. Clear browser cookies and try again

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