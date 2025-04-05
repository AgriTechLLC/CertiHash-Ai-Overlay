# CERTIHASH AI Prometheus Overlay

A comprehensive monitoring and visualization platform for Bitcoin SV blockchain transactions, powered by AI analytics and Prometheus metrics.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Security](#security)
- [AI Capabilities](#ai-capabilities)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [License](#license)

## Overview

CERTIHASH AI Prometheus Overlay provides real-time monitoring, anomaly detection, and predictive analytics for Bitcoin SV (BSV) blockchain transactions. The platform combines Prometheus metrics collection with advanced AI-powered analysis and visualization through Grafana dashboards. The system helps users understand blockchain activity patterns, detect security issues, and gain predictive insights.

## Key Features

### Analytics & Visualization
- Real-time monitoring of BSV transaction metrics
- Comprehensive Grafana dashboards for transaction visualization
- Comparative performance analysis across different time frames
- Transaction volume, TPS, and confirmation time tracking

### Advanced AI Capabilities
- Natural Language Interface for querying blockchain data
- AI-powered anomaly detection with detailed explanations
- Predictive analytics for transaction volume and patterns
- AI-generated dashboards based on natural language descriptions
- Vector-augmented knowledge base for domain-specific insights
- AI model performance monitoring and feedback system

### Security
- Complete JWT-based authentication with refresh tokens
- API key management for programmatic access
- Role-based access control (RBAC) with granular permissions
- Advanced rate limiting for all endpoints
- Security event logging and monitoring
- HTTPS with TLS 1.2/1.3 enforcement

### Integration
- Blockchain verification via BSV SDK
- MCP-Grafana for AI interaction with dashboards
- Prometheus metrics collection and storage
- Redis caching for performance optimization
- Vector database for AI knowledge storage

## Architecture

The CERTIHASH AI Prometheus Overlay uses a microservices architecture with the following components:

- **UI Frontend**: React-based web application
- **UI Backend**: Node.js Express API with advanced security features
- **Authentication Service**: JWT authentication and user management
- **Metrics Service**: Prometheus metrics collection
- **AI Service**: LiteLLM proxy with specialized AI models
- **Blockchain Module**: BSV blockchain integration
- **MCP-Grafana**: AI interaction with Grafana dashboards
- **Vector Database**: Milvus vector database for AI knowledge storage

All components are containerized with Docker and orchestrated using Docker Compose.

### System Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  UI Frontend │────▶│  UI Backend   │────▶│  Auth Service │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
┌─────────────┐     │              │     ┌─────────────┐
│ Blockchain   │────▶│  Metrics     │◀────│  Redis Cache │
│  Module     │     │  Service     │     └─────────────┘
└─────────────┘     │              │
                    └───────┬──────┘
                            │
                            ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ MCP-Grafana  │◀────│ Prometheus   │────▶│  Grafana    │
└─────────────┘     └──────────────┘     └─────────────┘
       ▲                                         ▲
       │                                         │
       └─────────────┐               ┌───────────┘
                     ▼               ▼
               ┌──────────────┐     ┌─────────────┐
               │  LiteLLM AI   │────▶│ Vector DB   │
               │  Service     │     │ (Milvus)    │
               └──────────────┘     └─────────────┘
```

## Security

The CERTIHASH AI Prometheus Overlay implements multiple layers of security, including:

### Authentication & Authorization
- **JWT Authentication**: Secure tokens with short expiration times
- **Refresh Token Mechanism**: HTTP-only cookies with longer expiry
- **API Key Support**: For programmatic access with granular permissions
- **Role-Based Access Control**: User, Analyst, Admin, and Superadmin roles

### API Security
- **Rate Limiting**: Different limits per endpoint sensitivity
- **Input Validation**: Strict validation for all user inputs
- **Output Encoding**: Proper sanitization of returned data
- **CORS Protection**: Strict cross-origin policies

### Network Security
- **HTTPS Enforcement**: All traffic encrypted with TLS 1.2/1.3
- **Security Headers**: Content-Security-Policy, X-Frame-Options, etc.
- **Secure Cookies**: HTTP-only, Secure, SameSite strict flags
- **Docker Isolation**: Services compartmentalized in containers

For more details, see the [SECURITY.md](SECURITY.md) file.

## AI Capabilities

The platform provides multiple AI capabilities:

### Natural Language Processing
- Query blockchain data using natural language
- Get human-readable explanations of transaction patterns
- Interact with dashboards via natural language commands

### Anomaly Detection
- Machine learning-based anomaly detection
- Detailed explanations of detected anomalies
- Historical comparison and trend analysis
- Severity classification of anomalies

### Predictive Analytics
- Forecast future transaction volumes and patterns
- Identify potential network congestion in advance
- Predict fee trends based on historical data
- Confidence intervals for all predictions

### Dashboard Generation
- AI-generated dashboards based on natural language descriptions
- Smart metric selection based on user requirements
- Automatic panel arrangement and visualization type selection
- Dashboard sharing and export

### AI Feedback System
- Rate AI responses for continuous improvement
- Detailed model performance monitoring
- Usage analytics across different AI models
- Specialized models for different tasks

## Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for development)
- MongoDB
- Redis
- Prometheus
- Grafana

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/certihash/certihash-overlay.git
cd certihash-overlay
```

2. Set up security:
```bash
# Give execute permissions to the script
chmod +x scripts/setup-security.sh

# Run the script (requires sudo)
sudo npm run setup-security
```

3. Start the services:
```bash
docker-compose up -d
```

4. Access the application:
```
https://localhost
```

## Configuration

### Environment Variables

The security setup script creates a `.env` file with secure default values. Review and update the following variables:

- `JWT_SECRET` and `JWT_REFRESH_SECRET`: Generated strong random strings
- `REDIS_PASSWORD`: Password for Redis connection
- `MONGO_USERNAME` and `MONGO_PASSWORD`: MongoDB credentials
- `OPENAI_API_KEY`: Your OpenAI API key (required for AI features)
- `GRAFANA_API_KEY`: Your Grafana API key

### Custom Configuration

You can customize various aspects of the application:

- **Prometheus**: Edit `visualization/provisioning/prometheus.yml`
- **Grafana Dashboards**: Modify files in `visualization/dashboards/`
- **AI Models**: Configure in `ai-service/proxy_config.yaml`
- **Security Settings**: Adjust in `ui/src/nginx.conf`

## Usage

### Web Interface

The web interface provides access to all features:

1. **Dashboard**: Overview of key metrics and transaction stats
2. **NLP Query**: Natural language interface to the blockchain data
3. **Anomaly Alerts**: View and investigate detected anomalies
4. **Transaction Stats**: Detailed transaction metrics and charts
5. **AI Assistant**: Access to all AI capabilities in one interface
6. **Security Center**: Manage security settings and monitor events

### API Access

For programmatic access, you can use the REST API with API key authentication:

1. Generate an API key in the Security Center
2. Include the API key in the `X-API-Key` header
3. Access endpoints following the API documentation

## Development

### Project Structure

```
certihash-overlay/
├── ai-service/            # LiteLLM proxy configuration
├── auth-service/          # Authentication service
├── blockchain-module/     # BSV blockchain integration
├── docker-compose.yml     # Docker Compose configuration
├── metrics-service/       # Prometheus metrics collector
├── scripts/               # Utility scripts
├── ui/                    # Frontend and backend UI
│   ├── server/            # Express backend
│   └── src/               # React frontend
└── visualization/         # Grafana and Prometheus configuration
```

### Development Setup

1. Install dependencies:
```bash
# UI Backend
cd ui
npm install

# UI Frontend
cd src
npm install

# Metrics Service
cd ../../metrics-service
npm install
```

2. Start development servers:
```bash
# Start the UI (both frontend and backend)
cd ui
npm run dev

# In another terminal, start the metrics service
cd metrics-service
npm run dev
```

### Code Linting and Security Checks

Run code quality and security checks:

```bash
# Run ESLint
npm run lint

# Run security audit
npm run security-check
```

## License

Copyright © 2023 CERTIHASH. All rights reserved.

---

Built with ❤️ by the CERTIHASH Team