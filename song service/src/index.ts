import express, { json } from "express";
import dotenv from "dotenv";
import {sql} from "./config/db.js";
import redis from "redis";
import cors from "cors";
import songRoutes from "./route.js";

dotenv.config();

export const redisClient =redis.createClient({
    password:process.env.redis_pass||'',
    socket:{
        host:process.env.redis_host,
        port:parseInt(process.env.redis_port||'18634') ,
    }

});

redisClient.connect().then(()=>console.log("Redis connected")).catch(console.error);



const app=express();
app.use(cors());
app.use(express.json());

const port=process.env.PORT||3006;

app.use('/api/v1',songRoutes);
app.listen(port,()=>{
    console.log(`Application running at port ${port}`);
})