const express = require("express");

const router = express.Router();

const { getRecentEntries } = require("../services/diaryMemory");
const { generateDiarySuggestion } = require("../services/aiService");

// ----------------------
// DIARY AI
// ----------------------

router.post("/diary-suggest", async (req, res) => {

    try {

        const { userId, currentText } = req.body;

        if (!userId || !currentText) {

            return res.status(400).json({
                error: "Missing userId or currentText"
            });

        }

        const previousEntries = await getRecentEntries(userId);

        const suggestion = await generateDiarySuggestion(
            currentText,
            previousEntries
        );

        res.json({
            suggestion
        });

    }

    catch (err) {

        console.error("Diary AI Route Error:", err);

        res.status(500).json({

            error: "Failed to generate suggestion",

            suggestion: ""

        });

    }

});

module.exports = router;