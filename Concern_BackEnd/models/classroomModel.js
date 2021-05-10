const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    classroomID: { type: String, required: true},
    studentDataIDList:{type: Array},
    startTime:{type: String},
    endTime:{type: String},
    isClassing:{type: Boolean, default: false, required: true }
  },
  {
    timestamps: true,
  }
);

const classroomModel = mongoose.model("Classroom", classroomSchema);

module.exports = classroomModel;