const mongoose = require("mongoose");

const SchoolSchema =
    new mongoose.Schema({

        schoolId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
        },

        address: {
            type: String,
            default: ""
        },

        contactEmail: {
            type: String,
            default: ""
        },

        contactPhone: {
            type: String,
            default: ""
        },

        established: {
            type: Date,
            default: null
        },

        globalStatus: {
            type: String,
            default: "active",
            enum: ["active", "inactive"]
        },

        createdAt: {
            type: Date,
            default: Date.now
        }

    });

module.exports = mongoose.model("School", SchoolSchema);
