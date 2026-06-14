function buildChatPrompt(conversation) {
    return `
You are helping continue a conversation.

Conversation:
${conversation}

Suggest ONE natural reply.

Rules:
- Maximum 8 words.
- Friendly.
- No explanation.
- Output only the reply.
`;
}

module.exports = buildChatPrompt;