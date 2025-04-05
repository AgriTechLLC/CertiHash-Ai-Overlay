FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Create directory for logs
RUN mkdir -p logs

# Bundle app source
COPY . .

# Expose auth service port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:3002/health || exit 1

# Start the service
CMD ["node", "index.js"]