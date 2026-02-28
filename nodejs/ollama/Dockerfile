# Use Ubuntu 22.04 base
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    zstd \
    ca-certificates \
    libcurl4 \
    socat \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Forward Render's dynamic port to Ollama's port
# Render sets $PORT automatically
ENV PORT 11434

# Expose Render port
EXPOSE $PORT

# Start Ollama in the background and forward the port
CMD sh -c "ollama serve & socat TCP-LISTEN:$PORT,fork TCP:127.0.0.1:11434"