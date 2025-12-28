'use server';

import OpenAI from 'openai';

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: string }[]) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { error: "AI Configuration Missing" };
        }

        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "ERNAM Digital Twin",
            }
        });

        // Convert history to OpenAI format
        // 'model' role in Gemini -> 'assistant' in OpenAI
        const messages = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user' as const,
            content: h.parts
        }));

        // Add current message
        messages.push({ role: 'user', content: message });

        // Add System Prompt
        const fullMessages = [
            { role: 'system', content: "You are the ERNAM Digital Twin AI Assistant. You are helpful, professional, and knowledgeable about aviation training." },
            ...messages
        ];

        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: fullMessages as any,
        });

        return { text: completion.choices[0].message.content };
    } catch (error) {
        console.error("Chat Error:", error);
        return { error: "Failed to generate response" };
    }
}
