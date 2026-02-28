# Use Ubuntu 22.04 base
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=11434

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    zstd \
    ca-certificates \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Expose the port (Render assigns a dynamic port)
EXPOSE $PORT

# Start Ollama
CMD ["sh", "-c", "ollama serve --port $PORT"]