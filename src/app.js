import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

// major configurations for middlewares 
app.use(express.json({limit: "200kb"}));
app.use(express.urlencoded({extended: true, limit: "100kb"}));
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.route.js';

//routes declarations
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter)



export {app} 