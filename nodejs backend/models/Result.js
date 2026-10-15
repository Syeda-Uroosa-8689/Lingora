const mongoose = require("mongoose");

/* =========================================
   STUDENT ASSESSMENT RESULTS
   Final challenge / quiz scores and
   the recorded answers.
========================================= */

const ResultSchema =
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

        challengeType: {
            type: String,
            default: ""
        },

        score: {
            type: Number,
            default: 0
        },

        maxScore: {
            type: Number,
            default: 25
        },

        passed: {
            type: Boolean,
            default: false
        },

        answers: {
            type: mongoose.Schema.Types.Mixed,
            default: []
        },

        completedAt: {
            type: Date,
            default: Date.now
        }

    });

ResultSchema.index(
    { user: 1, challengeType: 1, completedAt: -1 }
);

module.exports = mongoose.model("Result", ResultSchema);
