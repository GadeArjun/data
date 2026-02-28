# # Use a lightweight Python image
# FROM python:3.10-slim

# # Install system dependencies (including curl for Ollama)
# RUN apt-get update && apt-get install -y \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# # Install Ollama
# RUN curl -fsSL https://ollama.com/install.sh | sh

# # Set working directory
# WORKDIR /app

# # Copy application files
# COPY . .

# # Install Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # Create a non-root user for security
# RUN useradd -m -u 1000 user
# USER user
# ENV HOME=/home/user
# ENV PATH="/home/user/.local/bin:${PATH}"

# # Expose the port Hugging Face requires
# EXPOSE 7860

# # Command to run Ollama and Gunicorn
# CMD ["sh", "-c", "ollama serve & sleep 5 && ollama pull qwen2.5:1.5b && gunicorn -w 1 -b 0.0.0.0:7860 wsgi:app --timeout 300"]



FROM python:3.10-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://ollama.com/install.sh | sh
WORKDIR /app
COPY AI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY AI/ .
RUN useradd -m -u 1000 user && \
    USER user && \
    ENV HOME=/home/user \
    ENV PATH="/home/user/.local/bin:${PATH}"
EXPOSE 7860
CMD ["sh", "-c", "ollama serve & sleep 5 && ollama pull qwen2.5:1.5b && gunicorn -w 1 -b 0.0.0.0:7860 wsgi:app --timeout 300"]