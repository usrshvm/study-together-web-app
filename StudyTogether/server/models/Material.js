
const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        fileUrl: {
            type: String,
            trim: true,
            default: ""
        },
        fileType: {
            type: String,
            trim: true,
            default: ""
        },
        fileSize: {
            type: Number,
            default: 0
        },
        originalName: {
            type: String,
            trim: true,
            default: ""
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
