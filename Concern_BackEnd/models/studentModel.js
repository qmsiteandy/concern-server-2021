const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true},
    studentID: { type: String, required: true},
    newConcernDegree:{type: Number},
    concernDegreeArray:{type: Array},
    timeLineArray:{type: Array},
    lastedClassroom: { type: String, required: true}
  },
  {
    timestamps: true,
  }
);

const studentModel = mongoose.model("Classmate", studentSchema);

module.exports = studentModel;