# Use Ubuntu 22.04
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl zstd ca-certificates libcurl4 socat \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Render assigns the port dynamically
ENV PORT 10000
EXPOSE $PORT

# Start Ollama and forward $PORT to 11434 internally
CMD sh -c "ollama serve & socat TCP-LISTEN:$PORT,fork TCP:0.0.0.0:11434"