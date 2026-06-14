const diaryInput = document.getElementById("diaryInput");
const ghost = document.getElementById("ghostSuggestion");

const historyBtn = document.getElementById("historyBtn");
const systemBtn = document.getElementById("systemBtn");
const saveBtn = document.getElementById("saveBtn");

const historyPanel = document.getElementById("historyPanel");
const systemPanel = document.getElementById("systemPanel");

let diaryEntries = [];

let suggestionActive = false;
let typingTimer = null;
let aiLoading = false;

let lastSuggestion = "";
let lastSuggestionLength = 0;

const PAUSE_TIME = 5000;
const NEW_CHARS_REQUIRED = 75;

// ---------------- PANEL ----------------

historyBtn.onclick = () => historyPanel.classList.toggle("hidden");
systemBtn.onclick = () => systemPanel.classList.toggle("hidden");

// ---------------- SAVE ----------------

saveBtn.onclick = () => {

    const text = diaryInput.value.trim();

    if (!text) return;

    diaryEntries.push({
        text,
        time: new Date().toISOString()
    });

    renderHistory();

    diaryInput.value = "";

    clearGhost();

    lastSuggestion = "";
    lastSuggestionLength = 0;
};

// ---------------- HISTORY ----------------

function renderHistory() {

    const list = document.getElementById("historyList");

    list.innerHTML = "";

    diaryEntries
        .slice()
        .reverse()
        .forEach(entry => {

            const div = document.createElement("div");

            div.style.marginBottom = "15px";
            div.style.borderBottom = "1px solid rgba(255,255,255,.1)";
            div.style.paddingBottom = "10px";

            div.innerHTML = `
                <div style="color:#00e5ff;font-size:12px;">
                    ${new Date(entry.time).toLocaleString()}
                </div>

                <div>${entry.text}</div>
            `;

            list.appendChild(div);

        });

}

// ---------------- INPUT ----------------

diaryInput.addEventListener("input", () => {

    clearTimeout(typingTimer);

    clearGhost();

    if (
        lastSuggestion &&
        diaryInput.value.length - lastSuggestionLength < NEW_CHARS_REQUIRED
    ) {
        return;
    }

    if (diaryInput.value.trim().length < 20) {
        return;
    }

    typingTimer = setTimeout(() => {
        generateSuggestion();
    }, PAUSE_TIME);

});

// ---------------- AI ----------------

async function generateSuggestion() {

    if (aiLoading) return;

    const text = diaryInput.value.trim();

    if (text.length < 20) return;

    aiLoading = true;

    try {

        const user = JSON.parse(
            localStorage.getItem("interlinkedUser")
        );

        if (!user || !user.id) {

            aiLoading = false;
            return;

        }

        const response = await fetch("/api/ai/diary-suggest", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                userId: user.id,

                currentText: text

            })

        });

        if (!response.ok) {

            console.error("Backend Error:", response.status);

            aiLoading = false;

            return;

        }

        const data = await response.json();

        console.log("AI Response:", data);

        aiLoading = false;

        if (!data || !data.suggestion) return;

        if (data.suggestion === lastSuggestion) return;

        lastSuggestion = data.suggestion;
        lastSuggestionLength = diaryInput.value.length;

        ghost.innerText = "... " + data.suggestion;
        ghost.style.opacity = "1";
        ghost.style.pointerEvents = "auto";

        suggestionActive = true;

    }

    catch (err) {

        aiLoading = false;

        console.error(err);

    }

}

// ---------------- CLEAR ----------------

function clearGhost() {

    ghost.innerText = "";

    ghost.style.opacity = "0";

    ghost.style.pointerEvents = "none";

    suggestionActive = false;

}

// ---------------- ACCEPT ----------------

function acceptSuggestion() {

    if (!suggestionActive) return;

    diaryInput.value =
        diaryInput.value.trimEnd() +
        " " +
        lastSuggestion;

    clearGhost();

}

ghost.addEventListener("click", acceptSuggestion);

diaryInput.addEventListener("keydown", (e) => {

    if (e.key === "Tab" && suggestionActive) {

        e.preventDefault();

        acceptSuggestion();

    }

});