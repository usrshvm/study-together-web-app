
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const materialRoutes = require("./routes/materials");
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);

app.use(express.static(path.join(__dirname, "..")));

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "StudyTogether backend is running!"
    });
});

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(
                `StudyTogether running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
}

startServer();
