# Use Ubuntu base
FROM ubuntu:22.04

# Install Ollama (from official instructions)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://ollama.com/install.sh | sh

# Expose Render dynamic port
ENV PORT 11434
EXPOSE $PORT

# Start Ollama server on the Render port
CMD ["sh", "-c", "ollama serve --port $PORT"]