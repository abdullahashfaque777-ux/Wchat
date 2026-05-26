const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

function findPartner(socket){

    if(waitingUser){

        socket.partner = waitingUser;
        waitingUser.partner = socket;

        socket.emit(
            "chat-message",
            "Connected to a stranger!"
        );

        waitingUser.emit(
            "chat-message",
            "Connected to a stranger!"
        );

        waitingUser = null;

    } else {

        waitingUser = socket;

        socket.emit(
            "chat-message",
            "Waiting for stranger..."
        );

    }

}

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    findPartner(socket);

    socket.on("chat-message", (data) => {

        if(socket.partner){

            socket.partner.emit("chat-message", data);

        }

    });

    socket.on("typing", () => {

        if(socket.partner){

            socket.partner.emit("stranger-typing");

        }

    });

    socket.on("next-stranger", () => {

        if(socket.partner){

            socket.partner.partner = null;

            socket.partner.emit(
                "chat-message",
                "Stranger left the chat."
            );

        }

        socket.partner = null;

        findPartner(socket);

    });

    socket.on("disconnect", () => {

        if(waitingUser === socket){

            waitingUser = null;

        }

        if(socket.partner){

            socket.partner.partner = null;

            socket.partner.emit(
                "chat-message",
                "Stranger disconnected."
            );

        }

        console.log("User disconnected");

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});