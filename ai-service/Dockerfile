FROM ghcr.io/berriai/litellm:main-latest

# Copy configuration file
COPY ./proxy_config.yaml /app/proxy_config.yaml

# Expose the LiteLLM port
EXPOSE 4000

# Start LiteLLM with configuration
CMD ["--config", "/app/proxy_config.yaml"]