const axios = require("axios");

const config = require("../config/aiConfig");

const buildDiaryPrompt = require("../prompt/diaryPrompt");
const buildChatPrompt = require("../prompt/chatPrompt");

// ---------------------
// GROQ CALL
// ---------------------

async function callGroq(prompt) {

    try {

        if (!config.apiKey) {

            console.error("GROQ API KEY NOT FOUND");

            return "";

        }

        const response = await axios.post(

            config.apiUrl,

            {

                model: config.model,

                messages: [

                    {

                        role: "system",

                        content:
                            "You are Interlinked AI. Complete thoughts naturally and briefly."

                    },

                    {

                        role: "user",

                        content: prompt

                    }

                ],

                temperature: 0.8,

                max_tokens: 40

            },

            {

                headers: {

                    Authorization: `Bearer ${config.apiKey}`,

                    "Content-Type": "application/json"

                }

            }

        );

        const suggestion =
            response?.data?.choices?.[0]?.message?.content || "";

        return suggestion.trim();

    }

    catch (err) {

        console.error(
            "Groq Error:",
            err.response?.data || err.message
        );

        return "";

    }

}

// ---------------------
// DIARY
// ---------------------

async function generateDiarySuggestion(
    currentText,
    previousEntries = []
) {

    const prompt = buildDiaryPrompt(
        currentText,
        previousEntries
    );

    return await callGroq(prompt);

}

// ---------------------
// CHAT
// ---------------------

async function generateChatSuggestion(
    conversation
) {

    const prompt =
        buildChatPrompt(conversation);

    return await callGroq(prompt);

}

module.exports = {

    generateDiarySuggestion,

    generateChatSuggestion

};