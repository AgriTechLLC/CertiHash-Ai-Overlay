#!/bin/bash

# CERTIHASH AI Prometheus Overlay - Security Setup Script
# This script:
# 1. Generates SSL certificates for HTTPS
# 2. Sets up secure environment variables
# 3. Creates required directories and permissions

# Color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colorful header
echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}     CERTIHASH AI Prometheus Overlay - Security Setup${NC}"
echo -e "${BLUE}========================================================${NC}"
echo

# Exit on error
set -e

# Check if running with root privileges
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

# Detect environment
if [ -z "$ENV" ]; then
  ENV="development"
  echo -e "${YELLOW}No environment specified, defaulting to development${NC}"
else
  echo -e "${GREEN}Setting up for $ENV environment${NC}"
fi

# Create SSL directory if it doesn't exist
mkdir -p ssl
echo -e "${GREEN}Created SSL directory${NC}"

# Generate self-signed SSL certificates
echo -e "${BLUE}Generating SSL certificates...${NC}"

# Generate strong Diffie-Hellman parameters
echo -e "${YELLOW}Generating DH parameters (this may take a while)...${NC}"
openssl dhparam -out ssl/dhparam.pem 2048

# Generate private key
openssl genrsa -out ssl/server.key 4096

# Generate Certificate Signing Request (CSR)
DOMAIN=${DOMAIN:-"certihash.local"}
echo -e "${YELLOW}Generating certificate for domain: ${DOMAIN}${NC}"

# Create config file for certificate
cat > ssl/cert.conf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_ca

[dn]
C=US
ST=California
L=San Francisco
O=CERTIHASH
OU=Engineering
CN=${DOMAIN}

[v3_ca]
subjectAltName = @alt_names
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = *.${DOMAIN}
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

# Generate certificate
openssl req -new -x509 -nodes -days 365 -key ssl/server.key -out ssl/server.crt -config ssl/cert.conf

echo -e "${GREEN}SSL certificates generated successfully${NC}"

# Generate strong random secrets
echo -e "${BLUE}Generating secure environment variables...${NC}"

# Generate random strings for various secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 16)
GRAFANA_PASSWORD=$(openssl rand -base64 12)
MONGO_USERNAME="certihash"
MONGO_PASSWORD=$(openssl rand -base64 12)

# Create .env file
ENV_FILE=".env.${ENV}"
echo "Creating $ENV_FILE..."

cat > $ENV_FILE << EOF
# CERTIHASH AI Prometheus Overlay - Environment Variables
# Generated on $(date)
# Environment: ${ENV}

# Security
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
REDIS_PASSWORD=${REDIS_PASSWORD}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
MONGO_USERNAME=${MONGO_USERNAME}
MONGO_PASSWORD=${MONGO_PASSWORD}

# API Keys
# Replace these with your actual API keys
OPENAI_API_KEY=your-openai-api-key-here
GRAFANA_API_KEY=your-grafana-api-key-here
LITELLM_API_KEY=${JWT_SECRET} # Use same as JWT for simplicity in dev

# Domain configuration
DOMAIN=${DOMAIN}
CORS_ORIGIN=https://${DOMAIN}

# For MinIO (Vector DB)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=${REDIS_PASSWORD}

# Settings
NODE_ENV=${ENV}
LOG_LEVEL=info
EOF

echo -e "${GREEN}Environment file created: $ENV_FILE${NC}"
echo -e "${YELLOW}Note: You'll need to replace the OpenAI and Grafana API keys in the .env file${NC}"

# Set proper permissions for security files
chmod 600 $ENV_FILE
chmod 600 ssl/server.key
chmod 644 ssl/server.crt
chmod 644 ssl/dhparam.pem

echo -e "${GREEN}Proper file permissions set${NC}"

# Create required directories
mkdir -p logs
chmod 755 logs
echo -e "${GREEN}Log directory created${NC}"

echo -e "${BLUE}========================================================${NC}"
echo -e "${GREEN}Security setup completed successfully!${NC}"
echo -e "${BLUE}========================================================${NC}"
echo
echo -e "${YELLOW}Important: Before running the application, make sure to:${NC}"
echo -e "  1. Replace API keys in $ENV_FILE with actual values"
echo -e "  2. For production, replace the self-signed certificate with a trusted one"
echo -e "  3. Load the environment variables with: source $ENV_FILE"
echo

# End of script