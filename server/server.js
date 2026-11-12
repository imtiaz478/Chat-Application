import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoute.js";

import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);


// ======================================
// CORS
// ======================================

const allowedOrigins = [
    "http://localhost:5173",
    "https://chat-application-73vw.vercel.app"
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without origin
            // such as Postman/server-to-server
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "token"
        ]
    })
);

// প্রিফ্লাইট রিকোয়েস্ট (OPTIONS) সঠিকভাবে হ্যান্ডেল করার জন্য গ্লোবাল হ্যান্ডলার
app.options("*", cors());


// ======================================
// Body Parser
// ======================================

app.use(
    express.json({
        limit: "4mb"
    })
);


// ======================================
// Socket.IO
// ======================================

export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});


// Store online users

export const userSocketMap = {};


// Socket connection

io.on("connection", (socket) => {

    const userId = socket.handshake.query.userId;

    console.log("User Connected:", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit(
        "getOnlineUsers",
        Object.keys(userSocketMap)
    );


    socket.on("disconnect", () => {

        console.log("User Disconnected:", userId);

        if (userId) {
            delete userSocketMap[userId];
        }

        io.emit(
            "getOnlineUsers",
            Object.keys(userSocketMap)
        );

    });

});


// ======================================
// Routes
// ======================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server is live"
    });
});

app.use("/api/auth", userRouter);

app.use("/api/messages", messageRouter);


// ======================================
// Database
// ======================================

await connectDB();


// ======================================
// Local Development
// ======================================

if (process.env.NODE_ENV !== "production") {

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
        console.log(
            "Server is running on PORT: " + PORT
        );
    });

}


export default server;