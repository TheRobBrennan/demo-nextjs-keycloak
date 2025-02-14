# Interactive Walkthrough Guide

After setting up the demo using the instructions in DEMO.md, this guide will walk you through testing and exploring the application's features.

## 1. Initial Keycloak Setup

First, let's set up Keycloak with some test roles and users:

1. Access Keycloak admin console at https://tdr-keycloak.loca.lt/admin
   - Username: `admin`
   - Password: `admin`

2. Create roles:
   - Go to "Roles" in the left sidebar
   - Click "Create role"
   - Create two roles:
     * `system-admin`
     * `researcher`

3. Create a test user:
   - Go to "Users" → "Add user"
   - Username: `testuser`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Click "Create"
   
4. Set user password:
   - Go to "Credentials" tab
   - Set password: `password123`
   - Disable "Temporary" toggle
   - Click "Save"

5. Assign roles:
   - Go to "Role mappings" tab
   - Add both `system-admin` and `researcher` roles

## 2. Testing Authentication Flow

1. Visit the Next.js app at https://tdr-nextjs.loca.lt

2. Click "Signin with keycloak"
   - You should be redirected to Keycloak login
   - Login with testuser/password123

3. After successful login, you should see:
   - Your username
   - Your assigned roles
   - Links to admin and researcher sections

## 3. Testing Role-Based Access

1. Test Admin Access:
   - Click "Go to Admin Dashboard"
   - You should have access because of the `system-admin` role
   - Remove the `system-admin` role in Keycloak and try again
   - You should be redirected away

2. Test Researcher Access:
   - Click "Upload Research Files"
   - Try uploading some test files
   - Files will be saved in the `uploads/[username]` directory

## 4. Testing Authentication Features

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

## 5. Testing Protected Routes

1. Try accessing protected routes directly:
   - https://tdr-nextjs.loca.lt/private
   - https://tdr-nextjs.loca.lt/admin
   - You should be redirected to login if not authenticated

2. Test public routes:
   - https://tdr-nextjs.loca.lt/public
   - Should be accessible without login
   - Should show login button when not authenticated

## 6. Error Handling

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