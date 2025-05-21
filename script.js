const chatBox = document.getElementById("chat-box");
const startButton = document.getElementById("start-chat");

// ✅ Use your real Gemini API keys
const USER_AI_KEY = "AIzaSyA2wjh4vhb5UCHCOCs1_VcMu1G-_IucwjE";
const ASSISTANT_AI_KEY = "AIzaSyBI4f16GgU0mcD2eOUyaei2-CiBmdgrgn8";

const userApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${USER_AI_KEY}`;
const assistantApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ASSISTANT_AI_KEY}`;

let turn = 0;
let userSentence = "Hello! Today I have a test in science."; // Initial sentence

startButton.addEventListener("click", () => {
    startButton.disabled = true;
    runConversation();
});

function appendMessage(role, message) {
    const div = document.createElement("div");
    div.className = role;
    div.innerText = message;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function askUserAI(assistantFeedback, previeousSentence) {
    const prompt = `
Pretend you are a beginner English learner. Based on this follow-up question: "${assistantFeedback}", write a short response that is relevant and natural. Your response may be a statement or may include a related question. It should be 2–3 sentences long and may contain 1–2 typical grammar mistakes made by beginners. Only output the response without any explanation (There should be 100% times corrected responce).
`;

    try {
        const res = await fetch(userApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
        });

        const data = await res.json();
        if (!data.candidates?.length) throw new Error("No user AI response");

        return data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
        console.error("User AI Error:", err);
        return "I is happy to goes to school.";
    }
}

async function askAssistantAI(userInput) {
    const prompt = `
You are a grammar assistant. Given the sentence: "${userInput}", reply ONLY in valid JSON:

{
  "user": "${userInput}",
  "assistance": "Start by appreciating the user's effort (sometimes). Then, if there are basic grammar mistakes (e.g., verb tense, subject-verb agreement, articles, prepositions, or plurals), correct only those mistakes and briefly explain the correction. Do NOT correct punctuation, sentence structure, or style. If the sentence is already correct, just give a short positive comment (sometimes).",

"follow_up_question": "A follow-up question related to the user's sentence.",
  "score": "Grammar score out of 10 just numneric value."
}

Return ONLY the JSON. No markdown or other content.
`;

    try {
        const res = await fetch(assistantApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
        });

        const data = await res.json();
        // console.log("Assistant AI response:", data);

        if (!data.candidates?.length) throw new Error("No assistant response");

        let rawText = data.candidates[0].content.parts[0].text;
        // console.log("Assistant raw response:", rawText);
        rawText = rawText.replace(/```json|```/g, "").trim();
        return JSON.parse(rawText);
    } catch (err) {
        console.error("Assistant AI Error:", err);
        return {
            assistance: "Sorry, I couldn't understand your sentence.",
            score: "N/A"
        };
    }
}

const allConversations = [];

async function runConversation() {
    while (turn < 1000) {
        console.log("Turn:", turn);
        appendMessage("user", userSentence);

        const assistantReply = await askAssistantAI(userSentence);
        allConversations.push({
            user: assistantReply.user,
            assistance: assistantReply.assistance + " " + assistantReply.follow_up_question,
            score: assistantReply.score,
        });
        appendMessage("assistant", `${assistantReply.assistance + " question:" + assistantReply.follow_up_question} (Score: ${assistantReply.score})`);

        await new Promise(r => setTimeout(r, 4000));  

        userSentence = await askUserAI(assistantReply.follow_up_question, userSentence);
        turn++;
    }

    function downloadConversations(conversations) {
        const jsonString = JSON.stringify(conversations, null, 2);
        const fileSizeInBytes = new Blob([jsonString]).size;
        const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);

        const confirmDownload = confirm(`The file size is approximately ${fileSizeInKB} KB. Do you want to download it?`);

        if (!confirmDownload) {
            console.log("Download cancelled by user.");
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "conversationData.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    // Example usage after your console log:
    console.log("All conversations:", allConversations);
    downloadConversations(allConversations);

    appendMessage("assistant", "✅ Conversation ended after 5 turns.");
}
