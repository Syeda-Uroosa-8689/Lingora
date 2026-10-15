const mongoose = require("mongoose");

/* =========================================
   ENGLISH LEARNING CONTENT (PATHWAYS)
   A pathway groups topics; each topic holds
   subtopics; each subtopic holds lessons.
   E.g. Pathway 1 -> [ Listen & Repeat,
                       Speak,
                       Interact ]
========================================= */

const LessonSchema =
    new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        // the kind of activity this lesson is
        type: {
            type: String,
            default: "lesson"
        }
    },
    { _id: false });

const SubtopicSchema =
    new mongoose.Schema({
        subtopic: {
            type: String,
            required: true
        },
        lessons: {
            type: [LessonSchema],
            default: []
        }
    });

const TopicSchema =
    new mongoose.Schema({
        topic: {
            type: String,
            required: true
        },
        subtopics: {
            type: [SubtopicSchema],
            default: []
        }
    });

const PathwaySchema =
    new mongoose.Schema({

        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        topics: {
            type: [TopicSchema],
            default: []
        },

        createdAt: {
            type: Date,
            default: Date.now
        }

    });

module.exports = mongoose.model("Pathway", PathwaySchema);
