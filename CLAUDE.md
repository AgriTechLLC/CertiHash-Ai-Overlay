# CERTIHASH AI-Powered Prometheus Overlay - Development Notes

## Project Overview
This project is an AI-powered Prometheus overlay for CERTIHASH, integrating blockchain technology with metrics monitoring and AI-powered analytics. It enhances standard Prometheus monitoring with advanced AI capabilities, blockchain data integrity, and a comprehensive security model.

## Project Goals
- Provide real-time blockchain metrics monitoring with AI augmentation
- Ensure data integrity through blockchain verification of critical metrics
- Enable natural language processing for metrics analysis and querying
- Automate anomaly detection and predictive analytics
- Implement comprehensive security with enterprise-grade authentication
- Create an intuitive UI for both technical and non-technical users

## Development Timeline

### Phase 1: Core Implementation
- Created the basic application architecture and microservices
- Set up Docker containerization for all services
- Implemented Prometheus integration and metrics collection
- Added Grafana dashboards for visualization
- Integrated blockchain storage via BSV and Arcivist
- Developed metrics optimization services for performance
- Created initial API endpoints for metrics access
- Set up data flow architecture between services

### Phase 2: Security Enhancements
- Added JWT authentication with refresh tokens
- Implemented role-based access control (RBAC) system
- Created rate limiting middleware with Redis
- Set up security headers with CSP and other protections
- Added API key authentication for services and external clients
- Configured SSL/TLS with secure cipher suites
- Enhanced error handling and logging with security event tracking
- Developed User model with security features including 2FA
- Created scripts for security configuration
- Implemented secure password handling with argon2 hashing
- Added CORS protection with configurable origins
- Implemented IP-based blocking for suspicious activity
- Created automated security testing scripts
- Added API versioning for backward compatibility

### Phase 3: UI Components
- Built core dashboard components
- Developed responsive layout for all device sizes
- Added AI-powered features including:
  - Natural language query interface with context awareness
  - Anomaly detection with customizable sensitivity
  - Predictive analytics for trend forecasting
  - Auto-generated dashboards based on usage patterns
  - AI-powered alerting system with noise reduction
  - Feedback system for continuous AI improvement
- Created security management UI:
  - Security Dashboard with threat visualizations
  - Account Security Panel with 2FA management
  - API Management Panel for key generation and permissions
  - Security Logs Panel with filtering and export
  - User management interface for administrators
  - Role and permission assignment UI
- Added UX improvements:
  - Dark/light mode toggle
  - User-specific dashboard preferences
  - Configurable alert thresholds
  - Export capabilities for reports
  - Interactive tutorial system

### Phase 4: Advanced Features (Planned)
- Enhanced AI capabilities with specialized models
- Multi-chain integration for broader blockchain support
- Advanced visualization techniques for complex data
- Real-time collaboration features
- Mobile application development
- Data warehousing for long-term analytics
- Integration with external SIEM systems
- Geospatial analytics for distributed nodes

## Technical Architecture Details

### AI Component
- Uses LLM-based models for NLP queries through Anthropic's Claude API
- Vector database for storing embeddings of metrics descriptions
- Fine-tuned models for anomaly detection specific to blockchain metrics
- Prompt engineering system for generating optimal LLM interactions
- Response caching mechanism for performance optimization
- Feedback loop system for continuous model improvement

### Security Implementation
- Multi-layered authentication approach:
  - JWT for session management with secure token rotation
  - API keys for service-to-service communication 
  - Optional 2FA for user accounts using TOTP
- Granular permission system with 20+ defined permissions
- Context-aware rate limiting that adapts to endpoint sensitivity
- Comprehensive logging with PII protection and rotation policy
- Regular security scan integration for dependency vulnerabilities

### Blockchain Integration
- BSV used for immutable storage of verification hashes
- Arcivist client for efficient blockchain interactions
- Cryptographic verification system for data integrity checks
- Timestamping service for audit capabilities
- Scheduled verification jobs to ensure data consistency

### Repository Organization
- `ai-service/` - AI capabilities and LLM integration
- `auth-service/` - Authentication and user management
- `blockchain-module/` - BSV and Arcivist integration
- `metrics-service/` - Prometheus metrics collection and optimization
- `scripts/` - Setup and configuration utilities
- `ui/` - Frontend and backend for the web interface
- `visualization/` - Grafana dashboards and Prometheus configuration

## Key Files and Their Functions
- `ui/server/middleware/rbac.js` - Implements the role-based access control system
- `ui/server/middleware/rateLimiter.js` - Configures Redis-based rate limiting
- `ui/server/middleware/securityHeaders.js` - Sets up secure HTTP headers
- `ui/server/middleware/apiKeyAuth.js` - Handles API key validation and rate limiting
- `ui/server/models/User.js` - Comprehensive user model with security features
- `ui/src/components/SecurityDashboard.js` - Main security status interface
- `ai-service/scripts/query_llm.js` - Handles LLM interactions for natural language processing
- `scripts/setup-security.sh` - Configures security settings during deployment
- `blockchain-module/bsv_signature.js` - Manages cryptographic operations for blockchain

## Notes for Future Development
1. The application uses Anthropic's Claude for AI capabilities, configured in ai-service
2. Security is implemented at multiple layers with comprehensive RBAC
3. All services are containerized and can be deployed with docker-compose
4. Remember to check README.md files in each directory for specific component details
5. GitHub repository: https://github.com/AgriTechLLC/CertiHash-Ai-Overlay.git
6. The rate limiting configuration should be tuned based on production traffic patterns
7. Consider implementing a central logging service for production deployment
8. Connection pooling is implemented but should be monitored for performance
9. The websocket implementation for real-time updates may need scaling considerations
10. The Redis cache has a default TTL that should be adjusted based on data volatility

## Deployment Instructions
1. Clone the repository from GitHub
2. Copy .env.example to .env and configure all required variables
3. Run `docker-compose up -d` to start all services
4. Access the web UI at the configured port (default: 3000)
5. Log in with the default admin credentials (then change them immediately)
6. Run the security setup script to configure SSL certificates
7. For production deployments, consider using a reverse proxy like Nginx

## Environment Setup
Environment variables are detailed in .env.example - remember to create a proper .env file before deployment. Critical variables include:
- Database connection strings
- JWT secrets
- API keys for external services
- Rate limiting configurations
- Logging levels and paths

## Maintenance Recommendations
1. Regular dependency updates for security patching
2. Database backups on a consistent schedule
3. Log rotation and archiving strategy
4. Performance monitoring of rate-limited endpoints
5. Regular review of security logs for potential issues
6. Periodic security penetration testing
7. AI model performance evaluation and retraining