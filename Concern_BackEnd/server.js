const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');

const studentRouter = require("./routers/studentRouter");
const teacherRouter = require("./routers/teacherRouter");

require('dotenv').config();

mongoose.connect(process.env.MONGODB_ATLAS_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/student", studentRouter);
app.use("/api/teacher", teacherRouter);

app.get("/", (req, res) => {
  res.send("Server is ready！！");
});
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Serve at http://localhost:${port}`);
});
