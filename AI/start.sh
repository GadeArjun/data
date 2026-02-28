#!/bin/bash
PORT=5000
fuser -k $PORT/tcp
ollama serve > ollama.log 2>&1 &
sleep 5
curl http://localhost:11434 || { echo "Ollama server failed"; exit 1; }

echo "Pulling smaller model..."
ollama pull qwen2.5:0.5b
# gunicorn -w 1 -b 0.0.0.0:$PORT wsgi:app --timeout 300
gunicorn -w 4 --threads 2 -b 0.0.0.0:$PORT wsgi:app --timeout 300
# gunicorn -w 2 --threads 2 -b 0.0.0.0:$PORT wsgi:app --timeout 300


# Install dependencies: pip install -r requirements.txt

# Make script executable: chmod +x start.sh

# Run: ./start.sh