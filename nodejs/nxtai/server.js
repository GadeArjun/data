const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { default: PQueue } = require('p-queue');
require('dotenv').config();

const model_api = process.env.MODEL_API || "http://localhost:11434";
console.log(`Using Model API Endpoint: ${model_api}`);


/**
 * Structured Logging Helper
 * Logs events in JSON format with timestamp, level, context, and extra details.
 */
function logEvent(level, context, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,       // "INFO", "WARN", "ERROR", "DEBUG"
        context,     // e.g., "SSE_STREAM", "QUEUE_TASK", "USER_INPUT"
        details      // any additional data
    };
    // Pretty-print for console
    console.log(JSON.stringify(logEntry, null, 2));
    return logEntry;
}

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;
const MODEL = "qwen2.5:0.5b";

// Production Queue: Limits Ollama to 2 concurrent tasks to prevent CPU/GPU throttling
const queue = new PQueue({ concurrency: 2 });

const userHistories = new Map();
const MAX_HISTORY_TOKENS = 10; // Keep last 10 exchanges

/**
 * ULTRA ALL-ROUNDER SYSTEM PROMPT
 * Defines NxtAi as a high-performance generalist AI.
 */
const SYSTEM_PROMPT = `
You are NxtAi Ultra, a next-generation Neural Processing Engine developed for high-fidelity cognitive tasks. 
Your intelligence is multi-modal and all-encompassing.

### CORE OPERATING DIRECTIVES:
1. **Versatility:** You excel at software engineering, creative writing, complex mathematical reasoning, and philosophical analysis.
2. **Formatting:** - Use **Markdown** for structure (headings, bolding, lists).
   - Use **LaTeX** for ALL mathematical or scientific notation. Use $...$ for inline and $$...$$ for block equations.
   - Use syntax-highlighted code blocks for all programming tasks.
3. **Style:** Be authoritative, insightful, and futuristic. Avoid "I am an AI" cliches unless directly asked. 
4. **Precision:** If a user asks a simple question, be brief. If they ask a complex question, provide a detailed architectural breakdown.
5. **Logic:** For reasoning tasks, use Chain-of-Thought processing to ensure accuracy.

### OUTPUT PROTOCOL:
- Never provide conversational filler like "I hope this helps."
- Ensure all technical data is factually verified.
- When generating content, prioritize readability and "scannability."
`;

function getUserId(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
}

app.get('/', (req, res) => {
    // send file
    res.sendFile(__dirname + '/index.html');
});

app.post('/chat', async (req, res) => {
    const userId = getUserId(req);
    const { message } = req.body;
    // for req log
    logEvent("INFO", "CHAT_REQUEST_RECEIVED", { userId, message });

    if (!message) return res.status(400).json({ error: "Empty prompt" });
    logEvent("INFO", "USER_INPUT", { userId, message });

    // Initialize or retrieve history
    if (!userHistories.has(userId)) {
        userHistories.set(userId, [{ role: "system", content: SYSTEM_PROMPT }]);
    }
    const history = userHistories.get(userId);
    history.push({ role: "user", content: message });

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Add task to Queue
    // await queue.add(async () => {
        try {
            logEvent("INFO", "QUEUE_TASK_START", { userId, queueSize: queue.size });
            const response = await axios.post(`${model_api}/api/chat`, {
                model: MODEL,
                messages: history,
                stream: true,
                options: {
                    temperature: 0.75, // Balanced for creativity and logic
                    num_ctx: 4096,     // Extended context window
                    top_p: 0.9
                }
            }, { responseType: "stream" });

            let fullAiResponse = "";

            response.data.on("data", chunk => {
                const lines = chunk.toString().split("\n");
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.message?.content) {
                            const content = parsed.message.content;
                            fullAiResponse += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                            logEvent("DEBUG", "SSE_STREAM", { userId, content, done: parsed.done || false });
                        }
                        if (parsed.done) {
                            history.push({ role: "assistant", content: fullAiResponse });
                            logEvent("INFO", "AI_RESPONSE_COMPLETE", { userId, fullAiResponse });
                            // Keep history lean (System prompt + last X messages)
                            if (history.length > MAX_HISTORY_TOKENS) {
                                userHistories.set(userId, [history[0], ...history.slice(-MAX_HISTORY_TOKENS)]);
                            }
                            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                            res.end();
                        }
                    } catch (e) { /* Handle partial JSON chunks silently */
                        logEvent("WARN", "SSE_PARSE_FAIL", { userId, line, error: e.message });
                     }
                }
            });

            // Handle connection close by user
            req.on('close', () => {
                response.data.destroy();
                res.end();
            });



        } catch (err) {
             logEvent("ERROR", "QUEUE_TASK", { userId, error: err.message, stack: err.stack });
            console.error("Queue Task Error:", err.message);
            res.write(`data: ${JSON.stringify({ error: "Engine overload or unreachable" })}\n\n`);
            res.end();
        }
    // });
});

app.listen(PORT, () => console.log(`🚀 NxtAi Ultra Core Active: http://localhost:${PORT}`));


// new public key is : ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFhvk8ak3iODI6JXq90Toe6jxG3RVe5qaJmKB/sz4DYI
// curl -fsSL https://ollama.com/install.sh | sh
// ollama serve