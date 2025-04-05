# Authentication Service

The authentication service manages user accounts, authentication, and authorization for the CERTIHASH system. This service implements:

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API key management
- Password reset and account recovery
- Security event logging

## Key Components

- `controllers/`: Request handlers for authentication operations
- `middleware/`: Authentication and validation middleware
- `models/`: Data models including the comprehensive User model
- `routes/`: API route definitions for auth endpoints