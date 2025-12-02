import TryCatch from "./TryCatch.js";
import type { Request } from "express";
import cloudinary from "cloudinary";

import getBuffer from "./config/datauri.js";

import {sql} from "./config/db.js";// postgres sql client 
import { redisClient } from "./index.js";

interface AuthenticationRequest extends Request{
    user?:{
        id:string;
        role:string;
    }
}


export const addAlbums =TryCatch(async(req:AuthenticationRequest,res)=>{

    if(req.user?.role!=="admin"){
        return res.status(401).json({
            message:"you are not admin",
            success:false
        });
    }

    const {title,description,thumbnail}=req.body;
    
    const file=req.file;

    if(!file){
        return res.status(400).json({
            message:"file is required",
            success:false
        });
    }

    const file_buffer=getBuffer(file);

    if(!file_buffer || !file_buffer.content){
        return res.status(500).json({
            message:"falied to generate buffer"
        });
    }

    const upload=await cloudinary.v2.uploader.upload(file_buffer.content,{
        folder:"album",
    });

    const result=await sql`INSERT INTO albums 
                    (title,description,thumbnail) VALUES 
                    (${title},${description},${upload.secure_url}) 
                    RETURNING *`;
    if(redisClient.isReady){
        await redisClient.del("albums");
    }
    res.status(201).json({
        message:"album added successfully", 
        album:result[0],
        success:true 
    });
    
})

export const addSongs =TryCatch(async(req:AuthenticationRequest,res)=>{
    console.log("User role:", req.user?.role);
    if(req.user?.role!=="admin"){
        
        return res.status(401).json({
            message:"you are not admin",
            success:false
        });
    }

    const {title,description,album}=req.body;
    
    const isAlumExist=await sql`SELECT * FROM albums WHERE id=${album}`;
    console.log("Album existence check:", isAlumExist);
    if(isAlumExist.length===0){
        return res.status(404).json({
            message:"album not found",
            success:false
        });
    }

    const file=req.file;

    if(!file){
        return res.status(400).json({
            message:"file is required",
            success:false
        });
    }
    const file_buffer=getBuffer(file);

    if(!file_buffer || !file_buffer.content){
        return res.status(500).json({
            message:"falied to generate buffer"
        });
    }

    const cloud=await cloudinary.v2.uploader.upload(file_buffer.content,{
        folder:"songs",
        resource_type:"video",
    });

    const result =await sql`INSERT INTO songs (title,description,audio,album_id) VALUES (${title},${description},${cloud.secure_url},${album}) RETURNING *`;
    
    if(redisClient.isReady){
        await redisClient.del("songs");
    }

    res.status(201).json({
        message:"song added successfully",
        success:true, 
    });
});

export const addThumbnail =TryCatch(async(req:AuthenticationRequest,res)=>{
    if(req.user?.role!=="admin"){
        return res.status(401).json({
            message:"you are not admin",
            success:false
        });
    }
    const song =await sql`SELECT * FROM songs WHERE id=${req.params.id}`;
    if(song.length===0){
        return res.status(404).json({
            message:"song not found",
            success:false
        });
    }

    const file=req.file;
    if(!file){
        return res.status(400).json({
            message:"file is required",
            success:false
        });
    }
    const file_buffer=getBuffer(file);

    if(!file_buffer || !file_buffer.content){
        return res.status(500).json({
            message:"falied to generate buffer"
        });
    }

    const cloud=await cloudinary.v2.uploader.upload(file_buffer.content);

    const result=await sql `
        UPDATE songs SET thumbnail = ${cloud.secure_url} WHERE id=${req.params.id} RETURNING *`;
     if(redisClient.isReady){
        await redisClient.del("songs");
    }
    res.status(200).json({
        message:"thumbnail added successfully",
        song:result[0],
        success:true
    });
});

export const deleteAlbum=TryCatch(async(req:AuthenticationRequest,res)=>{
    if(req.user?.role!=="admin"){
        return res.status(401).json({
            message:"you are not admin",
            success:false
        });
    }

    const {id}=req.params;
    const isAlumExist=await sql`SELECT * FROM albums WHERE id=${id}`;
    if(isAlumExist.length===0){
        return res.status(404).json({
            message:"album not found",
            success:false
        });
    }

    await sql `DELETE FROM songs WHERE album_id=${id}`;

    await sql `DELETE FROM albums WHERE id=${id}`;

     if(redisClient.isReady){
        await redisClient.del("albums");
    }

    res.json({
        message:"Album deleted successfully"
    });
});

export const deleteSong =TryCatch(async(req:AuthenticationRequest,res)=>{

    if(req.user?.role!=="admin"){
        return res.status(401).json({
            message:"you are not admin",
            success:false
        });
    }

    const {id}=req.params;
    const isSongExist=await sql`SELECT * FROM songs WHERE id=${id}`;

    if(isSongExist.length===0){
        return res.status(404).json({
            message:"Song not found",
            success:false
        });
    }

    await sql `DELETE FROM songs WHERE id=${id}`;
     if(redisClient.isReady){
        await redisClient.del("songs");
    }
    res.status(202).json({
        message:"Song deleted Succesfully"
    })

});

