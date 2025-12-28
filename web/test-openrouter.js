const OpenAI = require("openai");

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ERNAM Digital Twin",
    }
});

async function main() {
    try {
        console.log("Testing OpenRouter connection...");
        const completion = await openai.chat.completions.create({
            model: "mistralai/mistral-7b-instruct:free", // Using a free/cheap model for test
            messages: [
                { role: "user", content: "Say 'OpenRouter is working!'" }
            ],
        });

        console.log("Response:", completion.choices[0].message.content);
        console.log("✅ SUCCESS");
    } catch (error) {
        console.error("❌ FAILED");
        console.error(error);
    }
}

main();
