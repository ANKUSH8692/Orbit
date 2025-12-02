import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from "cors";

import userRouter from './route.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// mongodb connection
const connectDb=async()=>{
    try{
        mongoose.connect(process.env.MONGO_URI as string,{
            dbName:'Orbit'
        })
        console.log('Database connected successfully');
    }catch(err){
        console.error('Database connection error',err);
    }
}

connectDb();

app.use(express.json());
app.use(cors());

app.use("/api/v1",userRouter);


app.listen(port,()=>{
    console.log(`User service is running on port ${port}`);
})