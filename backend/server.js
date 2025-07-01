const express = require("express");
const cors = require("cors");
const path = require("path");
const connect = require("./config/db");
const router = require("./Routes/userRoute");
const server = express();
const dotenv = require("dotenv");
dotenv.config();
const chatrouter = require("../backend/Routes/chatRoute");
const messageRouter = require("../backend/Routes/messageRouter");
connect();
server.use(express.json());
const PORT = process.env.PORT || 8080;
server.use(cors());

server.use("/api/user", router);
server.use("/api/chat", chatrouter);
server.use("/api/message", messageRouter);

// deployement---------------------
const __dirname1 = path.resolve();

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  server.use(express.static(path.join(__dirname1, "/client/dist")));
  server.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"));
  });
} else {
  server.get("/", (req, res) => {
    res.send("API SUCCESS");
  });
}
// ----------------------------
const app = server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(app, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("user joiner" + room);
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.to(user._id).emit("message recieved", newMessageReceived);
    });
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing"); // fixed here
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
