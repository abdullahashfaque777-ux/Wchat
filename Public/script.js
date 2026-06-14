const socket = io();

/* ---------------- UI ELEMENTS ---------------- */

const loginScreen = document.getElementById("loginScreen");
const loadingScreen = document.getElementById("loadingScreen");
const chatApp = document.getElementById("chatApp");

const startBtn = document.getElementById("startBtn");
const userIdInput = document.getElementById("userIdInput");
const countrySelect = document.getElementById("countrySelect");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const nextBtn = document.getElementById("nextBtn");

const chatBox = document.querySelector(".chat-box");
const typingIndicator = document.getElementById("typingIndicator");
const loadingText = document.getElementById("loadingText");

/* ---------------- STATE ---------------- */

let userData = {};
let connected = false;

/* ---------------- AUTO LOGIN ---------------- */

const savedUser = JSON.parse(
    localStorage.getItem("interlinkedUser")
);

if (savedUser) {

    userData = savedUser;

    loginScreen?.classList.add("hidden");
    loadingScreen?.classList.add("hidden");
    chatApp?.classList.remove("hidden");

    socket.emit("login", userData);

}

/* ---------------- HELPERS ---------------- */

function scrollToBottom() {
    if (!chatBox) return;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(text, type) {

    if (!chatBox) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("msg-wrapper");

    wrapper.style.alignItems =
        type === "me" ? "flex-end" : "flex-start";

    const message = document.createElement("div");
    message.classList.add("message", type);
    message.innerText = text;

    const time = document.createElement("div");
    time.classList.add("msg-time");

    const now = new Date();

    time.innerText =
        `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

    wrapper.appendChild(message);
    wrapper.appendChild(time);

    chatBox.appendChild(wrapper);

    scrollToBottom();
}

function addSystemMessage(text) {

    if (!chatBox) return;

    const div = document.createElement("div");

    div.classList.add("system-message");
    div.innerText = text;

    chatBox.appendChild(div);

    scrollToBottom();
}
/* ---------------- SEND MESSAGE ---------------- */

function sendMessage() {

    const text = messageInput?.value?.trim();

    if (!text) return;

    if (!connected) {
        addSystemMessage("Waiting for connection...");
        return;
    }

    addMessage(text, "me");

    socket.emit("chat-message", text);

    messageInput.value = "";
}

if (sendBtn) sendBtn.addEventListener("click", sendMessage);

if (messageInput) {

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    messageInput.addEventListener("input", () => {
        if (connected) socket.emit("typing");
    });

}

/* ---------------- NEXT STRANGER ---------------- */

if (nextBtn) {

    nextBtn.addEventListener("click", () => {

        connected = false;

        if (chatBox) chatBox.innerHTML = "";

        chatApp?.classList.add("hidden");
        loadingScreen?.classList.remove("hidden");

        if (loadingText) {
            loadingText.innerText = "Finding someone for you...";
        }

        socket.emit("next-stranger");
    });

}

/* ---------------- SOCKET EVENTS ---------------- */

if (startBtn) {

    startBtn.addEventListener("click", () => {

        const id = userIdInput?.value?.trim();
        const country = countrySelect?.value;

        if (!id) {
            alert("Enter email or phone");
            return;
        }

        userData = { id, country };

        localStorage.setItem(
            "interlinkedUser",
            JSON.stringify(userData)
        );

        loginScreen?.classList.add("hidden");
loadingScreen?.classList.remove("hidden");
chatApp?.classList.add("hidden");

socket.emit("login", userData);

    });

}
socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("login-success", (data) => {

    console.log("LOGIN SUCCESS:", data);

    localStorage.setItem("wchat_token", data.token);
    localStorage.setItem("nodeId", data.nodeId);

    socket.emit("join-queue");

});

socket.on("queue-status", (msg) => {
    if (loadingText) loadingText.innerText = msg;
});

socket.on("matched", () => {

    connected = true;

    loadingScreen?.classList.add("hidden");
    chatApp?.classList.remove("hidden");

    addSystemMessage("Connected to stranger!");
});

socket.on("chat-message", (msg) => {
    addMessage(msg, "stranger");
});

socket.on("stranger-typing", () => {

    if (!typingIndicator) return;

    typingIndicator.classList.remove("hidden");

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {
        typingIndicator.classList.add("hidden");
    }, 1000);

});

socket.on("disconnect", () => {

    connected = false;
    addSystemMessage("Disconnected from server.");

});

/* ---------------- NAV SYSTEM ---------------- */

const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");

navButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        navButtons.forEach(b =>
            b.classList.remove("active")
        );

        sections.forEach(s =>
            s.classList.remove("active")
        );

        btn.classList.add("active");

        const target = btn.dataset.section;

        document
            .getElementById(target + "Section")
            ?.classList.add("active");

    });

});

/* ---------------- NODE SYSTEM ---------------- */

const findNodeBtn =
document.getElementById("findNodeBtn");

const nodeCard =
document.getElementById("nodeCard");

const nodeId =
document.getElementById("nodeId");

const globalStatus =
document.getElementById("globalStatus");

const acceptNode =
document.getElementById("acceptNode");

const rejectNode =
document.getElementById("rejectNode");

if (findNodeBtn && nodeCard && nodeId && globalStatus) {

    findNodeBtn.addEventListener("click", () => {

        globalStatus.textContent =
        "SCANNING GLOBAL NETWORK...";

        nodeCard.style.display = "none";

        setTimeout(() => {

            const randomNode =
            Math.floor(Math.random() * 1000);

            nodeId.textContent = randomNode;

            nodeCard.style.display = "block";

        }, 1000);

    });

}

if (acceptNode) {

    acceptNode.addEventListener("click", () => {

        document
        .getElementById("chatSection")
        ?.classList.add("active");

        document
        .getElementById("globalSection")
        ?.classList.remove("active");

    });

}

if (rejectNode) {

    rejectNode.addEventListener("click", () => {

        if (nodeCard) nodeCard.style.display = "none";
        if (globalStatus) globalStatus.textContent = "NODE REJECTED";

        if (findNodeBtn) findNodeBtn.click();

    });

}

/* ---------------- ACTIVE NODES ---------------- */

const activeNodes =
document.getElementById("activeNodes");

if (activeNodes) {

    setInterval(() => {

        const count =
        Math.floor(Math.random() * 500 + 100);

        activeNodes.textContent =
        `ACTIVE NODES: ${count}`;

    }, 3000);

}