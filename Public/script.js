
const socket = io();

/* ---------------- UI ELEMENTS ---------------- */

const loginScreen = document.getElementById("loginScreen");
const chatApp = document.getElementById("chatApp");
const loadingScreen = document.getElementById("loadingScreen");

const startBtn = document.getElementById("startBtn");
const userIdInput = document.getElementById("userIdInput");
const countrySelect = document.getElementById("countrySelect");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const nextBtn = document.getElementById("nextBtn");

const chatBox = document.querySelector(".chat-box");
const typingIndicator = document.getElementById("typingIndicator");

/* ---------------- STATE ---------------- */

let userData = {};
let connected = false;

/* ---------------- LOGIN ---------------- */

startBtn.addEventListener("click", () => {

    const id = userIdInput.value.trim();
    const country = countrySelect.value;

    if(!id){
        alert("Enter email or phone");
        return;
    }

    userData = { id, country };

    loginScreen.classList.add("hidden");
    loadingScreen.classList.remove("hidden");

    socket.emit("login", userData);

});

/* ---------------- MESSAGE UI ---------------- */

function addMessage(text, type){

    const wrapper = document.createElement("div");
    wrapper.classList.add("msg-wrapper");

    const message = document.createElement("div");
    message.classList.add("message", type);
    message.innerText = text;

    const time = document.createElement("div");
    time.classList.add("msg-time");

    const now = new Date();
    time.innerText =
        now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");

    wrapper.appendChild(message);
    wrapper.appendChild(time);

    chatBox.appendChild(wrapper);

    chatBox.scrollTop = chatBox.scrollHeight;
}

/* ---------------- SYSTEM MESSAGE ---------------- */

function addSystemMessage(text){

    const div = document.createElement("div");
    div.classList.add("system-message");
    div.innerText = text;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

/* ---------------- SEND MESSAGE ---------------- */

function sendMessage(){

    const text = messageInput.value.trim();

    if(text === "") return;

    if(!connected){
        addSystemMessage("Waiting for connection...");
        return;
    }

    addMessage(`You: ${text}`, "me");

    socket.emit("chat-message", text);

    messageInput.value = "";

}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {

    if(event.key === "Enter"){
        sendMessage();
    }

});

/* ---------------- NEXT STRANGER ---------------- */

nextBtn.addEventListener("click", () => {

    connected = false;
    chatBox.innerHTML = "";

    socket.emit("next-stranger");

});

/* ---------------- SOCKET EVENTS ---------------- */

socket.on("login-success", (token) => {

    localStorage.setItem("wchat_token", token);

    loadingScreen.classList.add("hidden");
    chatApp.classList.remove("hidden");

    socket.emit("join-queue", userData);

});

/* MESSAGE HANDLING */

socket.on("chat-message", (msg) => {

    if(msg === "Connected to stranger"){

        addSystemMessage("Connected to stranger");
        connected = true;
        loadingScreen.classList.add("hidden");
        chatApp.classList.remove("hidden");
        return;

    }

    addMessage(msg, "stranger");

});

/* TYPING */

socket.on("stranger-typing", () => {

    typingIndicator.classList.remove("hidden");

    clearTimeout(window.typingTimer);

    window.typingTimer = setTimeout(() => {
        typingIndicator.classList.add("hidden");
    }, 1000);

});

messageInput.addEventListener("input", () => {

    socket.emit("typing");

});
socket.on("matched", () => {

    document
        .getElementById("loadingScreen")
        .classList.add("hidden");

    chatApp.classList.remove("hidden");

    addSystemMessage("Connected to stranger");

    connected = true;

});