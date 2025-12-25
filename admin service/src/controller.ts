import TryCatch from "./TryCatch.js";
import type { Request } from "express";
import cloudinary from "cloudinary";
import { GoogleGenerativeAI } from "@google/generative-ai";
import getBuffer from "./config/datauri.js";

import { sql } from "./config/db.js";// postgres sql client 
import { redisClient } from "./index.js";


interface AuthenticationRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

const apiKey = process.env.google_api_key;

const gemini_response = async (prompt: string): Promise<string> => {
    try {
        
        if (!apiKey) {
            throw new Error("Google API key is not set");
        }

        const generativeAI = new GoogleGenerativeAI(apiKey);
        const model = generativeAI.getGenerativeModel({ 
            model: "gemini-2.5-flash" 
        });
        
        const result = await model.generateContent(prompt);
        
        if (!result || !result.response) {
            throw new Error("No response received from Gemini");
        }
        
        const responseText = result.response.text();
        
        if (!responseText) {
            throw new Error("Empty response from Gemini");
        }
        
        return responseText;
    } catch (error) {
        throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export const addAlbums = TryCatch(async (req: AuthenticationRequest, res) => {

    console.log("Adding album");
    if (req.user?.role !== "admin") {
        
        return res.status(401).json({
            message: "you are not admin",
            success: false
        });
    }

    const { title, year } = req.body;

    const tags_response = await gemini_response(`Generate maximum of 8 tags for an album in comma separated format of ${title} in year ${year}`);
    const description = await gemini_response(`Generate a short description for an album in maximum of 20 words ${title} in year ${year}`);
    const file = req.file;
    const tags=tags_response.split(',').map((tag) => tag.trim());

    if (!file) {
        return res.status(400).json({
            message: "file is required",
            success: false
        });
    }

    const file_buffer = getBuffer(file);

    if (!file_buffer || !file_buffer.content) {
        return res.status(500).json({
            message: "falied to generate buffer"
        });
    }

    const upload = await cloudinary.v2.uploader.upload(file_buffer.content, {
        folder: "album",
    });

    const result = await sql`INSERT INTO albums 
                    (title,description,thumbnail,tags,year) VALUES 
                    (${title},${description},${upload.secure_url},${tags},${year}) 
                    RETURNING *`;

    if (redisClient.isReady) {
        await redisClient.del("albums");
    }


    res.status(201).json({
        message: "album added successfully",
        album: result[0],
        success: true
    });

})

export const addSongs = TryCatch(async (req: AuthenticationRequest, res) => {

    if (req.user?.role !== "admin") {
        return res.status(401).json({
            message: "you are not admin",
            success: false
        });
    }

    const { title, album, year } = req.body;
    const tags_response = await gemini_response(`Generate maximum of 8 tags for a song in comma separated format of ${title} in year ${year}`);
    const description = await gemini_response(`Generate a short description for a song in maximum of 20 words ${title} in year ${year}`);

    const tags=tags_response.split(',').map((tag) => tag.trim());
    const isAlumExist = await sql`SELECT * FROM albums WHERE id=${album}`;

    if (isAlumExist.length === 0) {
        return res.status(404).json({
            message: "album not found",
            success: false
        });
    }

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message: "file is required",
            success: false
        });
    }
    const file_buffer = getBuffer(file);

    if (!file_buffer || !file_buffer.content) {
        return res.status(500).json({
            message: "falied to generate buffer"
        });
    }

    const cloud = await cloudinary.v2.uploader.upload(file_buffer.content, {
        folder: "songs",
        resource_type: "video",
    });

    const result = await sql`INSERT INTO songs (title,description,audio,album_id,tags,year) VALUES (${title},${description},${cloud.secure_url},${album},${tags},${year}) RETURNING *`;

    if (redisClient.isReady) {
        await redisClient.del("songs");
    }

    res.status(201).json({
        message: "song added successfully",
        success: true,
    });
});

export const addThumbnail = TryCatch(async (req: AuthenticationRequest, res) => {

    if (req.user?.role !== "admin") {
        return res.status(401).json({
            message: "you are not admin",
            success: false
        });
    }
    const song = await sql`SELECT * FROM songs WHERE id=${req.params.id}`;
    if (song.length === 0) {
        return res.status(404).json({
            message: "song not found",
            success: false
        });
    }

    const file = req.file;
    if (!file) {
        return res.status(400).json({
            message: "file is required",
            success: false
        });
    }
    const file_buffer = getBuffer(file);

    if (!file_buffer || !file_buffer.content) {
        return res.status(500).json({
            message: "falied to generate buffer"
        });
    }

    const cloud = await cloudinary.v2.uploader.upload(file_buffer.content);

    const result = await sql`
        UPDATE songs SET thumbnail = ${cloud.secure_url} WHERE id=${req.params.id} RETURNING *`;
    if (redisClient.isReady) {
        await redisClient.del("songs");
    }
    res.status(200).json({
        message: "thumbnail added successfully",
        song: result[0],
        success: true
    });
});

export const deleteAlbum = TryCatch(async (req: AuthenticationRequest, res) => {
    if (req.user?.role !== "admin") {
        return res.status(401).json({
            message: "you are not admin",
            success: false
        });
    }

    const { id } = req.params;
    const isAlumExist = await sql`SELECT * FROM albums WHERE id=${id}`;
    if (isAlumExist.length === 0) {
        return res.status(404).json({
            message: "album not found",
            success: false
        });
    }

    await sql`DELETE FROM songs WHERE album_id=${id}`;

    await sql`DELETE FROM albums WHERE id=${id}`;

    if (redisClient.isReady) {
        await redisClient.del("albums");
    }

    res.json({
        message: "Album deleted successfully"
    });
});

export const deleteSong = TryCatch(async (req: AuthenticationRequest, res) => {

    if (req.user?.role !== "admin") {
        return res.status(401).json({
            message: "you are not admin",
            success: false
        });
    }

    const { id } = req.params;
    const isSongExist = await sql`SELECT * FROM songs WHERE id=${id}`;

    if (isSongExist.length === 0) {
        return res.status(404).json({
            message: "Song not found",
            success: false
        });
    }
    await sql`DELETE FROM songs WHERE id=${id}`;
    if (redisClient.isReady) {
        await redisClient.del("songs");
    }
    res.status(202).json({
        message: "Song deleted Succesfully"
    })

});

