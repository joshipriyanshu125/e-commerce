import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.OPENROUTER_API_KEY;
console.log("Testing OpenRouter key:", key ? key.substring(0, 15) + "..." : "MISSING");

const client = new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Atelier E-Commerce AI",
    },
});

const testModels = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "openai/gpt-oss-20b:free"
];

async function test() {
    for (const model of testModels) {
        try {
            console.log(`\nTesting model: ${model}`);
            const res = await client.chat.completions.create({
                model,
                messages: [{ role: "user", content: "Say hello in 3 words" }],
                max_tokens: 50,
            });
            console.log("SUCCESS!", model, "Output:", res.choices[0]?.message?.content);
            process.exit(0);
        } catch (err) {
            console.log("FAILED:", model, "->", err.message);
        }
    }
}

test();
