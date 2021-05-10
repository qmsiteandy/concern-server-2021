const express = require('express');
const expressAsyncHandler = require("express-async-handler");
const Classmate = require('../models/studentModel');
const Classroom = require('../models/classroomModel');
const teacherRouter = express.Router();
const { response } = require('express');

teacherRouter.post(
  "/startClass",
  expressAsyncHandler(async (req, res) => {
    const { classroomID, startTime } = req.body;

    const classroom = await Classroom.findOne({ classroomID });
    if (classroom) {
      classroom.startTime = startTime;
      classroom.endTime = "";
      classroom.isClassing = true;
      const updatedClassroom = await classroom.save();
    } else {
      const newClassroom = new Classroom({
        classroomID: classroomID,
        startTime: startTime,
        endTime: "",
        isClassing: true
      });
      const updatedClassroom = await newClassroom.save();
    }
    res.send("課堂初始化成功");
  })
);

teacherRouter.post(
  "/endClass",
  expressAsyncHandler(async (req, res) => {
    const { classroomID, endTime } = req.body;

    const classroom = await Classroom.findOne({ classroomID });
    if (classroom) {
      classroom.endTime = endTime;
      classroom.isClassing = false;
      const updatedClassroom = await classroom.save();
    }
    res.send("課堂結束");
  })
);

teacherRouter.post(
  "/getAllNewData",
  expressAsyncHandler(async (req, res) => {
    const { classroomID } = req.body;
    const classroom = await Classroom.findOne({ classroomID });
    const classmates = await Classmate.find({
      "_id" : {
        "$in" : classroom.studentDataIDList
       }
    });

    var dataString = "";
    classmates.map(classmate => {
      dataString += "{\"studentName\":\"" + classmate.studentName + "\", \"studentID\":\"" + classmate.studentID + "\", \"newConcernDegree\":\"" + classmate.newConcernDegree + "\"},";
    })
    dataString = dataString.substring(0, dataString.length - 1)

    res.send(dataString);
  })
)

teacherRouter.post(
  "/getClassmatesList",
  expressAsyncHandler(async (req, res) => {
    const { classroomID } = req.body;
    var NameList = new Array
    var IDList = new Array;
    var DataIDList = new Array;
    var classroomCount = 0;

    const classroom = await Classroom.findOne({ classroomID });
    const classmates = await Classmate.find({
      "_id" : {
        "$in" : classroom.studentDataIDList
       }
    });

    classroomCount = classroom.studentDataIDList.length
    classmates.map(classmate =>{
      NameList.push(classmate.studentName);
      IDList.push(classmate.studentID);
      DataIDList.push(classmate.id);
    })

    res.send({
      NameList,
      IDList,
      DataIDList
    });
  })
)


teacherRouter.post(
  "/getPersonConcernDiagram",
  expressAsyncHandler(async (req, res) => {
    const { classroomID, DataID, timeSpacing } = req.body;
    var newConcernArray = new Array;
    var concernAdder = 0;
    var newTimeArray = new Array;
    var dataCount = 0;
    var dataMax = timeSpacing;

    const classmate = await Classmate.findById(DataID);
    
    for (var i = 0; i < classmate.concernDegreeArray.length; i++) {
      if (dataCount < dataMax) {
        concernAdder += (Number)(classmate.concernDegreeArray[i]);
        dataCount += 1;
      }
      if (dataCount >= dataMax || i >= (classmate.concernDegreeArray.length - 1)) {

        var judgedConcern = 0;
        if ((concernAdder / dataCount) > 1) judgedConcern = 1;
        else if ((concernAdder / dataCount) < 0) judgedConcern = 0;
        else judgedConcern = (Math.round((concernAdder / dataCount) * 10)) / 10;

        newConcernArray.push(judgedConcern);
        newTimeArray.push(classmate.timeLineArray[i]);
        dataCount = 0;
        concernAdder = 0;
      }
    }

    res.send({
      "studentName": classmate.studentName,
      "concernArray": newConcernArray,
      "timeLineArray": newTimeArray
    });
  })
)


// teacherRouter.post(
//   "/getAllConcernDiagram",
//   expressAsyncHandler(async (req, res) => {
//     const { timeSpacing } = req.body;
//     var sendClassmatesData = new Array;
//     const Classmates = await Classmate.find({});
//     Classmates.map(classmate => {
//       var newConcernArray = new Array;
//       var concernAdder = 0;
//       var newTimeArray = new Array;
//       var dataCount = 0;
//       var dataMax = timeSpacing;
//       for (var i = 0; i < classmate.concernDegreeArray.length; i++) {
//         if (dataCount < dataMax) {
//           concernAdder += (Number)(classmate.concernDegreeArray[i]);
//           dataCount += 1;
//         }
//         if (dataCount >= dataMax || i >= (classmate.concernDegreeArray.length - 1)) {

//           var judgedConcern = 0;
//           if ((concernAdder / dataCount) > 1) judgedConcern = 1;
//           else if ((concernAdder / dataCount) < 0) judgedConcern = 0;
//           else judgedConcern = (Math.round((concernAdder / dataCount) * 10)) / 10;

//           newConcernArray.push(judgedConcern);
//           newTimeArray.push(classmate.timeLineArray[i]);
//           dataCount = 0;
//           concernAdder = 0;
//         }
//       }
//       sendClassmatesData.push({
//         "studentName": classmate.studentName,
//         "concernArray": newConcernArray,
//         "timeLineArray": newTimeArray
//       })
//     })

//     res.send(sendClassmatesData);
//   })
// )


teacherRouter.post(
  "/getAllConcernCalcDiagram",
  expressAsyncHandler(async (req, res) => {

    const { classroomID, timeSpacing } = req.body;
    const classroom = await Classroom.findOne({ classroomID });
    if (!classroom) {
      res.send("無此課堂資訊");
    }

    const concernLimit1 = 0.5;
    const concernLimit2 = 0.8;

    const startTime = classroom.startTime;
    const endTime = classroom.endTime;

    var newTimelineArray = new Array;
    do {
      if (newTimelineArray.length === 0) {
        newTimelineArray.push(DateToInt(startTime))
      }
      else {
        var newTime = newTimelineArray[newTimelineArray.length - 1] + timeSpacing;

        if (newTime % 100 >= 60) { newTime += 40; }
        if (newTime % 10000 >= 6000) { newTime += 4000; }
        if (newTime / 10000 >= 24) { newTime -= 240000; }

        if (newTime > DateToInt(endTime)) newTime = DateToInt(endTime)

        newTimelineArray.push(newTime);
      }
    } while (newTimelineArray[newTimelineArray.length - 1] < DateToInt(endTime));

    var redConcernCountArray = new Array(newTimelineArray.length);
    var yellowConcernCountArray = new Array(newTimelineArray.length);
    var greenConcernCountArray = new Array(newTimelineArray.length);
    redConcernCountArray.fill(0);
    yellowConcernCountArray.fill(0);
    greenConcernCountArray.fill(0);

    const classmates = await Classmate.find({
      "_id" : {
        "$in" : classroom.studentDataIDList
       }
    });
    classmates.map(classmate => {
      var concernAdder = 0;
      var dataCount = 0;
      var index = 0;

      for (var i = 0; i < classmate.timeLineArray.length; i++) {
        if (DateToInt(classmate.timeLineArray[i]) >= newTimelineArray[index] && DateToInt(classmate.timeLineArray[i]) < newTimelineArray[index + 1]) {
          concernAdder += (Number)(classmate.concernDegreeArray[i]);
          dataCount += 1;
        }
        else if (DateToInt(classmate.timeLineArray[i]) >= newTimelineArray[index + 1]) {
          var averageConcern = concernAdder / dataCount;
          if (averageConcern < concernLimit1) redConcernCountArray[index] += 1;
          else if (averageConcern >= concernLimit1 && averageConcern < concernLimit2) { yellowConcernCountArray[index] += 1; }
          else greenConcernCountArray[index] += 1;

          concernAdder = 0; dataCount = 0;
          index += 1;
        }
      }
    })

    for (var i = 0; i < newTimelineArray.length; i++) {
      newTimelineArray[i] = IntToDate(newTimelineArray[i]);
    }

    res.send({
      timelineArray: newTimelineArray,
      redConcernCountArray: redConcernCountArray,
      yellowConcernCountArray: yellowConcernCountArray,
      greenConcernCountArray: greenConcernCountArray
    });
  })
)

function DateToInt(dateString) {

  if (typeof dateString != "string") { return dateString; }

  var newDateString = "";
  var index = 0;

  do {
    if (dateString[index + 1] === ":") {
      newDateString += "0";
      newDateString += dateString[index];
      index += 2;
    }
    else if (index >= dateString.length - 1) {
      newDateString += "0";
      newDateString += dateString[index];
      index += 2;
    }
    else if (dateString[index] != ":" && dateString[index + 1] != ":") {
      newDateString += dateString[index];
      newDateString += dateString[index + 1];
      index += 3;
    }
  } while (index < dateString.length);

  return (Number)(newDateString);
}
function IntToDate(number) {

  if (typeof number != "number") { console.log("NOT"); return number; }

  var newDateString = "";

  var hour = parseInt(number / 10000);
  if (hour >= 10) newDateString += hour;
  else if (hour === 0) newDateString += "00";
  else { newDateString += "0"; newDateString += hour };

  newDateString += ":";

  var min = parseInt((number % 10000) / 100);
  if (min >= 10) newDateString += min;
  else if (min === 0) newDateString += "00";
  else { newDateString += "0"; newDateString += min };

  newDateString += ":";

  var second = parseInt(number % 100);
  if (second >= 10) newDateString += second;
  else if (second === 0) newDateString += "00";
  else { newDateString += "0"; newDateString += second };


  return newDateString;
}

module.exports = teacherRouter;