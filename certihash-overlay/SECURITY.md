# CERTIHASH AI Prometheus Overlay - Security Documentation

This document outlines the security features implemented in the CERTIHASH AI Prometheus Overlay application, best practices for secure deployment, and recommendations for maintaining security.

## Security Features

### Authentication & Authorization

- **JWT-Based Authentication**: Secure JWT tokens with short expiration times
- **Refresh Token Mechanism**: HTTP-only cookies for refresh tokens with longer expiration
- **API Key Support**: Alternative authentication method for programmatic access
- **Role-Based Access Control (RBAC)**: Granular permission system for different user roles:
  - User: Basic access to view metrics and dashboards
  - Analyst: Extended access to create dashboards and configure AI
  - Admin: Full system access including user management
  - Superadmin: Unrestricted access

### Request Security

- **Rate Limiting**: Different rate limits based on endpoint sensitivity:
  - Auth-specific limits: 10 requests per minute
  - AI-specific limits: 30 requests per minute
  - Admin operations: 20 requests per minute
  - General API: 100 requests per minute

- **HTTPS Enforcement**: All traffic is encrypted with TLS 1.2/1.3
- **Content Security Policy (CSP)**: Strict policy to prevent XSS attacks
- **Security Headers**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Feature-Policy/Permissions-Policy: Restricted browser features

### Data Protection

- **Password Security**: Passwords are hashed with bcrypt
- **Input Validation**: All user inputs are validated using express-validator
- **Output Encoding**: Proper sanitization of data returned to users
- **Sensitive Data Handling**: Logging system masks tokens and API keys
- **Audit Logging**: All security events are logged for review

### Network & Infrastructure

- **CORS Configuration**: Strict CORS policy with proper validation
- **Secure Cookie Configuration**: HTTP-only, secure, SameSite=Strict cookies
- **Nginx Security Configuration**: Advanced security settings for the web server
- **Reverse Proxy Protection**: API endpoints are protected behind reverse proxy
- **Docker Security**: Isolation of services in separate containers

## Security Deployment Guide

### 1. Setting Up SSL Certificates

Run the security setup script to generate SSL certificates and secure environment variables:

```bash
npm run setup-security
```

For production, replace the self-signed certificates with trusted certificates from a CA.

### 2. Environment Variables

The security setup script creates an environment file with secure defaults. Review and update the following variables:

- `JWT_SECRET` and `JWT_REFRESH_SECRET`: Generated strong random strings
- `REDIS_PASSWORD`: Password for Redis connection
- `MONGO_USERNAME` and `MONGO_PASSWORD`: MongoDB credentials
- `OPENAI_API_KEY`: Your OpenAI API key (required for AI features)
- `GRAFANA_API_KEY`: Your Grafana API key

### 3. Security Checks

Run the security check before deployment:

```bash
npm run security-check
```

### 4. Docker Compose Deployment

Use Docker Compose to deploy all services securely:

```bash
docker-compose up -d
```

## Security Maintenance

### Regular Updates

- Keep all dependencies updated
- Run `npm audit` regularly to check for vulnerabilities
- Run security linting with `npm run lint`

### Monitoring

- Review audit logs regularly
- Monitor security events and failed login attempts
- Set up alerts for unusual activity

### Incident Response

In case of a security incident:

1. Disconnect the affected service from the network
2. Revoke all potentially compromised tokens and API keys
3. Analyze logs to determine the extent of the breach
4. Apply necessary patches
5. Follow your organization's incident response procedures

## Security Contact

For security concerns or to report vulnerabilities, contact [security@certihash.com](mailto:security@certihash.com).

## Best Practices for Users

- Use strong passwords with at least 12 characters
- Enable two-factor authentication when available
- Regularly rotate API keys
- Follow the principle of least privilege for access control
- Do not share API keys or access tokens

---

This security documentation is maintained by the CERTIHASH Engineering Team.