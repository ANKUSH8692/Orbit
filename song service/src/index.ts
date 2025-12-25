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

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Don't throw here - just log
});

redisClient.on('connect', () => {
    console.log('Redis connected successfully');
});

redisClient.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

async function connectRedis() {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        // Implement retry logic or fallback
    }
}
connectRedis();


const app=express();
app.use(cors());
app.use(express.json());

const port=process.env.PORT||3006;

app.use('/api/v1',songRoutes);
app.listen(port,()=>{
    console.log(`Application running at port ${port}`);
})