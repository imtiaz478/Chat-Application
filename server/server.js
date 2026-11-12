import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoute.js";

const app = express();
const server = http.createServer(app);

// ======================================
// CORS Configuration
// ======================================
const allowedOrigins = [
    "http://localhost:5173",
    "https://chat-application-73vw.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token", "X-Requested-With", "Accept"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ======================================
// Body Parser
// ======================================
app.use(express.json({ limit: "4mb" }));

// ======================================
// Socket.IO (শুধুমাত্র লোকাল বা VPS এর জন্য)
// ======================================
export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        if (userId) delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// ======================================
// Database Connection Middleware
// ======================================
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ success: false, message: "Database connection failed" });
    }
});

// ======================================
// Routes
// ======================================
app.get("/api/status", (req, res) => {
    res.json({ success: true, message: "Server is live" });
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ======================================
// Local Development
// ======================================
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log("Server is running on PORT: " + PORT);
    });
}

// Vercel এর জন্য অবশ্যই app এক্সপোর্ট করতে হবে
export default app;