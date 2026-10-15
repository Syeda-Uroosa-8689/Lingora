const mongoose = require("mongoose");

/* =========================================
   STUDENT LEARNING PROGRESS
   Tracks a student's progress through
   pathways -> topics -> subtopics -> lessons.
========================================= */

const ProgressSchema =
    new mongoose.Schema({

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        userName: {
            type: String,
            default: ""
        },

        school: {
            type: String,
            default: null
        },

        pathway: {
            type: String,
            default: ""
        },

        topic: {
            type: String,
            default: ""
        },

        subtopic: {
            type: String,
            default: ""
        },

        lesson: {
            type: String,
            default: ""
        },

        activity: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["in_progress", "completed"],
            default: "in_progress"
        },

        score: {
            type: Number,
            default: 0
        },

        maxScore: {
            type: Number,
            default: 0
        },

        completedAt: {
            type: Date,
            default: Date.now
        }

    });

ProgressSchema.index(
    { user: 1, pathway: 1, topic: 1, subtopic: 1, lesson: 1 },
    { unique: true }
);

module.exports = mongoose.model("Progress", ProgressSchema);
