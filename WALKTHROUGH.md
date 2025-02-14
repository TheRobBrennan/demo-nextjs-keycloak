# Interactive Walkthrough Guide

After setting up the demo using the instructions in [DEMO.md](DEMO.md), this guide will walk you through testing and exploring the application's features.

## 1. Default Users

The system comes with two preconfigured users:

1. System Administrator
   - Username: `sysadmin`
   - Password: `sysadmin`
   - Roles: `system-admin`
   - Use this account to access administrative features

2. Researcher
   - Username: `researcher`
   - Password: `researcher`
   - Roles: `researcher`
   - Use this account to test researcher-specific features

## 2. Initial Access

When you run `npm run demo`, the script will:
1. Clean up any existing environment
2. Remove previous Docker containers and tunnels
3. Start fresh Docker containers
4. Create secure tunnels and display their URLs
5. Configure Keycloak automatically
6. Start the Next.js application

Take note of the URLs displayed in your console - they will be unique for each session.

## 3. Testing Authentication Flow

1. Visit the Next.js app URL shown in your console

2. Click "Signin with keycloak"
   - You should be redirected to Keycloak login
   - Login with either `sysadmin/sysadmin` or `researcher/researcher`

3. After successful login, you should see:
   - Your username
   - Your assigned roles
   - Links to role-specific sections

## 4. Testing Role-Based Access

1. Login as System Administrator (`sysadmin/sysadmin`)
   - You should see the "Admin Dashboard" link
   - Click it to access admin-only features

2. Logout and login as Researcher (`researcher/researcher`)
   - You should see the "Upload Research Files" link
   - Click it to access researcher-only features

## 5. Troubleshooting

If you encounter issues:

1. Check the console output for the correct URLs
2. Ensure cloudflared is running properly
3. Wait a few moments for the tunnels to stabilize
4. If needed, restart the demo with `npm run demo:build`

## 6. Cleanup

When you're done:
1. Press Ctrl+C to stop the application
2. The script will automatically:
   - Stop the tunnels
   - Shut down Docker containers
   - Clean up temporary files

## 7. Testing Authentication Features

1. Test Session Management:
   ```typescript:src/components/SessionGuard.tsx
   startLine: 1
   endLine: 14
   ```
   - Your session will automatically refresh
   - If refresh fails, you'll be redirected to login

2. Test Logout Flow:
   - Click "Signout of keycloak"
   - You should be logged out of both:
     * Next.js application
     * Keycloak session

## 8. Testing Protected Routes

1. Try accessing protected routes directly:
   - https://tdr-nextjs.loca.lt/private
   - https://tdr-nextjs.loca.lt/admin
   - You should be redirected to login if not authenticated

2. Test public routes:
   - https://tdr-nextjs.loca.lt/public
   - Should be accessible without login
   - Should show login button when not authenticated

## 9. Error Handling

1. Test Invalid Login:
   - Try logging in with incorrect credentials
   - You should see appropriate error messages

2. Test Role-Based Errors:
   - Remove all roles from your test user
   - Try accessing protected routes
   - You should see "Not Authorized" messages

## Troubleshooting Common Issues

1. If Keycloak admin console becomes unresponsive:
   ```bash
   docker compose restart keycloak
   ```

2. If session state becomes inconsistent:
   - Clear browser cookies
   - Restart the demo script
   - Try logging in again

3. If file uploads fail:
   - Check the console for errors
   - Verify the uploads directory permissions
   - Ensure your session is still valid

## Next Steps

1. Explore the code:
   - Review the middleware implementation for role-based access
   - Look at the NextAuth.js configuration
   - Understand the federated logout implementation

2. Try customizing:
   - Add new roles and permissions
   - Create additional protected routes
   - Modify the user interface

3. Security considerations:
   - Review token handling
   - Understand session management
   - Explore Keycloak's security features 