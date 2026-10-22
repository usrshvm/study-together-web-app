const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Material = require("../models/Material");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// All material routes require authentication
router.use(authenticateToken);

// 1. Get all materials for logged-in user
router.get("/", async (req, res) => {
    try {
        const materials = await Material.find({
            owner: req.user.userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            materials
        });
    } catch (error) {
        console.error("Fetch materials error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not load study materials."
        });
    }
});

// 2. Upload / Create a material
router.post("/", upload.single("file"), async (req, res) => {
    try {
        let title = req.body.title ? req.body.title.trim() : "";
        let subject = req.body.subject ? req.body.subject.trim() : "";
        const description = req.body.description ? req.body.description.trim() : "";

        let fileUrl = "";
        let fileType = "note";
        let fileSize = 0;
        let originalName = "";

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
            fileSize = req.file.size;
            originalName = req.file.originalname;

            const ext = path.extname(req.file.originalname).replace(".", "").toLowerCase();
            fileType = ext || "file";

            // If user did not provide a title, default to clean file name
            if (!title) {
                title = path.basename(req.file.originalname, path.extname(req.file.originalname));
            }
        }

        // Fallbacks
        if (!title) {
            title = "Untitled Material";
        }
        if (!subject) {
            subject = "General";
        }

        if (title.length > 150 || subject.length > 100 || description.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length limit."
            });
        }

        const material = await Material.create({
            title,
            subject,
            description,
            fileUrl,
            fileType,
            fileSize,
            originalName,
            owner: req.user.userId
        });

        res.status(201).json({
            success: true,
            message: "Study material saved successfully.",
            material
        });
    } catch (error) {
        console.error("Create material error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not save the study material: " + error.message
        });
    }
});

// 3. Update material details (title, subject, description)
router.patch("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found."
            });
        }

        const { title, subject, description } = req.body;

        if (title !== undefined) {
            const cleanTitle = String(title).trim();
            if (!cleanTitle) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot be empty."
                });
            }
            if (cleanTitle.length > 150) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot exceed 150 characters."
                });
            }
            material.title = cleanTitle;
        }

        if (subject !== undefined) {
            const cleanSubject = String(subject).trim();
            if (!cleanSubject) {
                return res.status(400).json({
                    success: false,
                    message: "Subject cannot be empty."
                });
            }
            if (cleanSubject.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Subject cannot exceed 100 characters."
                });
            }
            material.subject = cleanSubject;
        }

        if (description !== undefined) {
            const cleanDesc = String(description).trim();
            if (cleanDesc.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 1000 characters."
                });
            }
            material.description = cleanDesc;
        }

        await material.save();

        res.json({
            success: true,
            message: "Material updated successfully.",
            material
        });
    } catch (error) {
        console.error("Update material error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not update material details."
        });
    }
});

// 3.5 Get single material details
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found."
            });
        }

        res.json({
            success: true,
            material
        });
    } catch (error) {
        console.error("Get material error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not retrieve material."
        });
    }
});

// 4. Download material file with original filename
router.get("/:id/download", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found."
            });
        }

        if (!material.fileUrl) {
            return res.status(400).json({
                success: false,
                message: "This material has no attached file."
            });
        }

        const fileName = path.basename(material.fileUrl);
        const filePath = path.join(uploadsDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Attached file was not found on server."
            });
        }

        const downloadName = material.originalName || `${material.title}.${material.fileType || "pdf"}`;
        res.download(filePath, downloadName);
    } catch (error) {
        console.error("Download error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not download the file."
        });
    }
});

// 4.5 Inline view of material file
router.get("/:id/view", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material || !material.fileUrl) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        const fileName = path.basename(material.fileUrl);
        const filePath = path.join(uploadsDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found on server."
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error("Inline view error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not display file."
        });
    }
});

// 4.6 Get text / code file content for in-app reader
router.get("/:id/text", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material || !material.fileUrl) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        const fileName = path.basename(material.fileUrl);
        const filePath = path.join(uploadsDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found on server."
            });
        }

        const stats = fs.statSync(filePath);
        if (stats.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: "File is too large to preview as raw text."
            });
        }

        const content = fs.readFileSync(filePath, "utf-8");
        res.json({
            success: true,
            content,
            title: material.title,
            originalName: material.originalName,
            fileType: material.fileType
        });
    } catch (error) {
        console.error("Read text error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not read file text."
        });
    }
});

// 5. Delete material and remove file from disk
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid material ID."
            });
        }

        const material = await Material.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found."
            });
        }

        // If it had a file on disk, remove it
        if (material.fileUrl) {
            const fileName = path.basename(material.fileUrl);
            const filePath = path.join(uploadsDir, fileName);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== "ENOENT") {
                    console.error("Failed to delete file from disk:", err.message);
                }
            });
        }

        res.json({
            success: true,
            message: "Study material deleted."
        });
    } catch (error) {
        console.error("Delete material error:", error.message);
        res.status(500).json({
            success: false,
            message: "Could not delete the material."
        });
    }
});

module.exports = router;
