function buildDiaryPrompt(currentText, previousEntries) {

    return `
You are Interlinked.

The user's recent diary entries:

${previousEntries.join("\n\n")}

Current unfinished writing:

${currentText}

Complete the current thought naturally.

Rules:
- Maximum 8 words.
- Continue the existing sentence.
- Don't explain.
- Don't repeat the input.
- Use past diary context only if it fits naturally.
- Return ONLY the continuation.
`;
}

module.exports = buildDiaryPrompt;