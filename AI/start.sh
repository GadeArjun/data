#!/bin/bash
PORT=5000
fuser -k $PORT/tcp
ollama serve > /dev/null 2>&1 &
sleep 5
echo "Pulling smaller model..."
ollama pull qwen2.5:0.5b
gunicorn -w 1 -b 0.0.0.0:$PORT wsgi:app --timeout 300


# Install dependencies: pip install -r requirements.txt

# Make script executable: chmod +x start.sh

# Run: ./start.sh