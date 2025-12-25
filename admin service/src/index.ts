import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import redis from "redis";


import { sql } from "./config/db.js";

import adminRoutes from "./route.js";


dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.cloud_name || "",
    api_key: process.env.cloud_api_key || "",
    api_secret: process.env.cloud_api_secret || ""
});


// config Redis
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

//Redis db creating
async function initDB() {
    try {
        await sql`create table if not exists albums(
        id serial primary key, 
        title varchar(255) not null, 
        description varchar(255) not null,
        thumbnail varchar(255) not null,
        tags varchar(255)[],
        year varchar(4) not null,
        created_at timestamp default current_timestamp)`;

        await sql`create table if not exists songs(
        id serial primary key, 
        title varchar(255) not null, 
        description varchar(255) not null,
        thumbnail varchar(255),
        audio varchar(255) not null,
        album_id int references albums(id) on delete set null,
        year varchar(4) not null,
        tags varchar(255)[],
        created_at timestamp default current_timestamp)`;

        console.log("database initialized");
    } catch (err) {
        console.log("Error connecting to DB", err);
    }
}


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1',adminRoutes)

const PORT = process.env.PORT || 3003;



initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Admin service is running at port ${PORT}`);
    })
});


// or 
// async function startServer() {
//     try {
//         await initDB();
//         app.listen(PORT, () => {
//             console.log(`Admin service is running at port ${PORT}`);
//         });
//     } catch (err) {
//         console.error("Server failed to start ❌", err);
//         process.exit(1); // optional: stop if DB fails
//     }
// }

// startServer();