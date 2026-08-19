# Cerberus SSO Frontend

A Single Sign-On (SSO) frontend application built with Next.js 15, React 19, and Shadcn UI components.

## Features

- 🔐 **Secure Authentication**: Email/password login with JWT token-based authentication
- 🎨 **Dark Theme**: Modern black/dark UI using Shadcn components
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Auto-redirect**: Automatic redirection to login page for unauthenticated users
- 👤 **User Dashboard**: Display account and company information after login
- 🛡️ **Session Management**: Secure session storage with automatic logout

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - High-quality component library
- **React Hook Form** - Forms with validation
- **Zod** - TypeScript-first schema validation

## Deployment

- **Frontend**: https://app.cerberustech.inc
- **Backend API**: https://api.cerberustechinc.com

## API Integration

The application integrates with the Cerberus API endpoints:

- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user profile

## Project Structure

```
cerber_sso/
├── app/
│   ├── login/          # Login page
│   ├── page.tsx        # Main dashboard
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/ui/      # Shadcn UI components
├── lib/
│   ├── auth.ts         # Authentication utilities
│   └── utils.ts        # Utility functions
└── middleware.ts       # Next.js middleware
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   Set the `NEXT_PUBLIC_API_URL` environment variable to point to your Cerberus API:
   ```
   NEXT_PUBLIC_API_URL=https://api.cerberustechinc.com/api
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Authentication Flow

1. **Unauthenticated Access**: Users are automatically redirected to `/login`
2. **Login Form**: Users enter email and password credentials
3. **API Call**: Credentials are sent to `POST /auth/login`
4. **Token Storage**: JWT token is stored in browser session storage
5. **User Data**: User profile is fetched from `GET /auth/me` and stored
6. **Dashboard**: User is redirected to main dashboard with account information
7. **Logout**: Session data is cleared and user is redirected to login

## Security Features

- JWT token-based authentication
- Session storage (not persistent across browser sessions)
- Automatic token validation
- Secure API communication
- No persistent data storage except for the API route

## Component Usage

The application uses Shadcn UI components in dark theme:

- **Card**: For layout containers
- **Input**: For form fields with dark styling
- **Button**: For actions and navigation
- **Badge**: For user role display
- **Alert**: For error messages
- **Label**: For form field labels

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Cerberus API base URL (default: https://api.cerberustechinc.com/api)

## Building for Production

```bash
npm run build
npm start
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Notes

- The application uses dark theme by default
- Session storage ensures data is not persisted beyond browser session
- Logo placeholder is included (marked for replacement when logo is provided)
- All API communications follow the structure defined in api-reference.yaml
