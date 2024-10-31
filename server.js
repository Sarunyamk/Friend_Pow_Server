const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const handleError = require("./middlewares/error");
const notFound = require("./middlewares/notFound");

const authRouter = require("./routes/auth-route");
const userRouter = require("./routes/user-route");
const eventRouter = require("./routes/event-route");


app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// เดี๋ยวค่อยเปลี่ยนเป็นตัวนี้ แล้วลบ cors ด้านบนออก
// app.use(express.static(process.env.STATIC_DIR));
// app.use(cors({
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
//     credentials: true,
// }));
app.use(bodyParser.json());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/event", eventRouter); 





app.use(handleError);
app.use('*', notFound);
app.listen(3000, () => console.log("Listening on port 3000"));
