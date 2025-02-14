# Manual Keycloak Setup Guide

This guide explains how to manually configure Keycloak if you need to make changes to the default setup.

## Prerequisites
- Running Keycloak instance (via Docker)
- Active cloudflared tunnels

## 1. Access Admin Console
1. Use the Keycloak URL displayed in your console
2. Add `/admin` to the URL
3. Login with:
   - Username: `admin`
   - Password: `admin`

## 2. Create Realm
1. Hover over "Master" in top-left
2. Click "Create Realm"
3. Name: `tdr`
4. Click "Create"

## 3. Create Client
1. Go to "Clients" → "Create client"
2. Client ID: `nextjs`
3. Click "Next"
4. Client authentication: ON
5. Click "Save"

## 4. Configure Client
1. Access type: `confidential`
2. Valid redirect URIs: Add your Next.js URL (from console) + `/*`
3. Web origins: Add your Next.js URL
4. Click "Save"

## 5. Create Roles
1. Go to "Realm roles"
2. Create roles:
   - `system-admin`
   - `researcher`

## 6. Create Users
1. Go to "Users" → "Add user"
2. Required fields:
   - Username
   - Email
   - First Name
   - Last Name
3. Click "Create"

## 7. Set User Password
1. Go to "Credentials" tab
2. Set password
3. Temporary: OFF
4. Click "Save"

## 8. Assign Roles
1. Go to "Role mappings"
2. Add desired roles

## 9. Environment Variables
Your .env.local will be created automatically with the correct URLs. If you need to modify it:

```sh
KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="your-client-secret"
KEYCLOAK_ISSUER="your-keycloak-url/realms/tdr"
NEXTAUTH_URL="your-nextjs-url"
NEXTAUTH_SECRET="your-generated-secret"
```

## Verification
1. Start your Next.js application
2. Visit your Next.js URL
3. Click login
4. You should be redirected to Keycloak
5. After successful login, you should see your roles displayed


