const socket = io();

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const chatBox = document.querySelector(".chat-box");

function scrollToBottom(){

    chatBox.scrollTop = chatBox.scrollHeight;

}

function addMessage(text, type){

    const message = document.createElement("div");

    message.classList.add("message");
    message.classList.add(type);

    message.innerText = text;

    chatBox.appendChild(message);

    scrollToBottom();

}

function sendMessage(){

    const text = messageInput.value.trim();

    if(text === ""){
        return;
    }

    addMessage(text, "me");

    socket.emit("chat-message", text);

    messageInput.value = "";

}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {

    if(event.key === "Enter"){
        sendMessage();
    }

});

socket.on("chat-message", (msg) => {

    addMessage(msg, "stranger");

});