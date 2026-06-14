// profile.js

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.querySelector(".logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            alert("Logged out (placeholder)");
        });
    }

    // ===========================
    // DIARY AI
    // ===========================

    const diaryInput = document.getElementById("diaryInput");
    const ghostSuggestion = document.getElementById("ghostSuggestion");

    if (!diaryInput || !ghostSuggestion) return;

    let typingTimer;
    let suggestionShown = false;
    let currentSuggestion = "";
    let lastSuggestionTriggerLength = 0;

    const PAUSE_TIME = 5000;

    diaryInput.addEventListener("input", () => {

        clearTimeout(typingTimer);

        hideSuggestion();

        if (
            suggestionShown &&
            diaryInput.value.length - lastSuggestionTriggerLength < 75
        ) {
            return;
        }

        typingTimer = setTimeout(() => {

            generateSuggestion();

        }, PAUSE_TIME);

    });

    async function generateSuggestion() {

        if (diaryInput.value.trim().length < 20) return;

        const res = await fetch("/api/ai/diary-suggest", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                currentText: diaryInput.value,

                previousEntries: []

            })

        });

        const data = await res.json();

        currentSuggestion = data.suggestion;

        showSuggestion(currentSuggestion);

        suggestionShown = true;

        lastSuggestionTriggerLength = diaryInput.value.length;

    }

    function showSuggestion(text) {

        ghostSuggestion.textContent = text;

        ghostSuggestion.style.opacity = "1";

        ghostSuggestion.style.pointerEvents = "auto";

    }

    function hideSuggestion() {

        ghostSuggestion.style.opacity = "0";

        ghostSuggestion.style.pointerEvents = "none";

    }

    ghostSuggestion.addEventListener("click", () => {

        diaryInput.value += " " + currentSuggestion;

        hideSuggestion();

        suggestionShown = false;

        currentSuggestion = "";

    });

});