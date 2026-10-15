const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
  },

  schoolId: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

ClassSchema.index(
  { name: 1, schoolId: 1 },
  { unique: true }
);

module.exports =
  mongoose.model("Class", ClassSchema);
