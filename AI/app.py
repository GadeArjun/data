from flask import Flask, render_template, request, Response, jsonify
import ollama
import threading
import logging
import json

# Configure logging for production debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("NxtAi")

app = Flask(__name__)

# --- CONFIGURATION ---
MODEL = 'qwen2.5:1.5b'
MAX_HISTORY = 6
PORT = 5000

# Global lock to prevent concurrent Ollama requests from crashing the device
ollama_lock = threading.Lock()
# Dictionary to store history per user (by session IP)
user_histories = {}

# --- SYSTEM PROMPT ---
# Defines the persona, capabilities, and constraints for the model
# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are NxtAi, a knowledgeable, concise, and helpful conversational AI assistant.
Your goal is to have a natural dialogue, explain concepts clearly, and help with tasks.

Capabilities:
1. Explain technical concepts simply.
2. Debug and write code with detailed explanations.
3. Answer general knowledge questions.

Constraints:
- YOU MUST BE CONVERSATIONAL.
- Do not output code immediately.
- If asked to write code, ALWAYS start your response with an explanation of what the code will do, and then provide the code block using markdown (```language).
- Be concise.
"""

# --- ROUTES ---
@app.route('/')
def index():
    # Renders the UI
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        user_id = request.remote_addr # Differentiate users by IP
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        logger.info(f"Processing message from {user_id}: {user_message[:50]}...")

        # Initialize history for new users with the system prompt
        if user_id not in user_histories:
            user_histories[user_id] = [{'role': 'system', 'content': SYSTEM_PROMPT}]

        # Store user message
        user_histories[user_id].append({'role': 'user', 'content': user_message})
        
        # Limit history to prevent OOM errors (Out of Memory)
        if len(user_histories[user_id]) > MAX_HISTORY:
            # Keep system prompt (index 0) and remove oldest conversation pairs
            user_histories[user_id].pop(1)

        # def generate():
        #     # THREAD LOCK: Ensures only one user interacts with Ollama at a time
        #     with ollama_lock:
        #         try:
        #             logger.info(f"Ollama stream started for {user_id}")
        #             stream = ollama.chat(
        #                 model=MODEL, 
        #                 messages=user_histories[user_id], 
        #                 stream=True
        #             )
                    
        #             full_response = ""
        #             for chunk in stream:
        #                 content = chunk['message']['content']
        #                 full_response += content
        #                 # Yield raw text immediately for true streaming
        #                 yield content
                    
        #             # Save final assistant response to history
        #             user_histories[user_id].append({'role': 'assistant', 'content': full_response})
        #             logger.info(f"Stream finished for {user_id}. Context len: {len(user_histories[user_id])}")
                    
        #         except Exception as e:
        #             logger.error(f"Ollama generation error: {e}")
        #             yield f" [Error: {str(e)}]"

        def generate():
            with ollama_lock:
                full_response = ""
                try:
                    logger.info(f"Ollama stream started for {user_id}")
                    stream = ollama.chat(model=MODEL, messages=user_histories[user_id], stream=True)

                    for chunk in stream:
                        content = chunk.get('message', {}).get('content', '')
                        if not content:
                            continue

                        full_response += content
                        # Convert string to bytes for Gunicorn
                        yield content.encode('utf-8')

                    user_histories[user_id].append({'role': 'assistant', 'content': full_response})
                    logger.info(f"Stream finished for {user_id}. Context len: {len(user_histories[user_id])}")

                except Exception as e:
                    logger.error(f"Ollama generation error: {e}")
                    yield f"[Error: {str(e)}]".encode('utf-8')

                    
        return Response(generate(), mimetype='text/plain; charset=utf-8')
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    # In production, this file should be run via gunicorn, not app.run()
    app.run(host='0.0.0.0', port=PORT, debug=False)