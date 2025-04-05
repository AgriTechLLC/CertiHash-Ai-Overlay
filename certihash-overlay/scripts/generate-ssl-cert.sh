#!/bin/bash

# Create directory for SSL certificates
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/private.key 2048

# Generate self-signed certificate
openssl req -new -x509 -key ssl/private.key -out ssl/cert.crt -days 365 -subj "/CN=localhost" \
    -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"

echo "Self-signed SSL certificate generated successfully"
echo "Place these files in the ssl directory that is mounted to the container"
echo "Files generated:"
echo "- ssl/private.key"
echo "- ssl/cert.crt"