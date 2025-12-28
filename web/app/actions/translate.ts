'use server';

import OpenAI from 'openai';

export async function translateText(text: string, targetLang: 'en' | 'fr') {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("Missing OPENROUTER_API_KEY");
            return null;
        }

        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
        });

        const prompt = targetLang === 'fr'
            ? `Translate the following course title to French. Maintain professional/academic tone. Return ONLY the translation, no quotes.\n\n"${text}"`
            : `Translate the following course title to English. Maintain professional/academic tone. Return ONLY the translation, no quotes.\n\n"${text}"`;

        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free", // Using free tier high-quality model
            messages: [{ role: "user", content: prompt }],
        });

        return completion.choices[0].message.content?.trim();
    } catch (error) {
        console.error("Translation Error:", error);
        return null;
    }
}
