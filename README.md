# NextJS + Keycloak Demo

This repository demonstrates how to use Keycloak as an authentication broker for a Next.js v13 application.

## Quick Start

```bash
npm run demo
```

This will automatically:
- Set up the environment
- Start Docker containers (Keycloak + Postgres)
- Create secure tunnels for external access
- Configure Keycloak
- Launch the Next.js application

## Prerequisites

1. Node.js 16 or higher
2. Docker and Docker Compose
3. Cloudflared
   - macOS users with Homebrew: `brew install cloudflared`
   - Other platforms: [Installation Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

## Manual Setup

For detailed setup instructions, see:
- [Demo Guide](DEMO.md) - Quick start and basic setup
- [Keycloak Setup](KEYCLOAK_SETUP.md) - Detailed Keycloak configuration
- [Walkthrough](WALKTHROUGH.md) - Step-by-step feature exploration

## Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Start in production mode
npm start
```

> Note: For local development without tunnels, set appropriate environment variables in `.env.local`

## Blog Post
For a detailed explanation, check out our [blog post](https://medium.com/@harshbhandariv/secure-nextjs-v13-application-with-keycloak-6f68406bb3b5)

## Getting Started

### Run keycloak with a postgres database
```bash
docker compose up -d
```
> Please note that the above method cannot be used for production.

### Run the development server

```bash
NODE_OPTIONS='--dns-result-order=ipv4first' npm run dev
```

### To build the project
```bash
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### To start the nextjs server(production mode)
```bash
NODE_OPTIONS='--dns-result-order=ipv4first'  npm start
```
> Make sure to setup the environment variables.
