import TryCatch from "./TryCatch.js";
import {sql} from "./config/db.js"
import {redisClient} from "./index.js"

export const getAllAlbum=TryCatch(async(req,res)=>{
    let albums;
    const Cache_Exp=1800;//half hour

    if(redisClient.isReady){
        albums=await redisClient.get("albums");
    }
    if(albums){
        // redis cache has albums
        //console.log("cache hit");
        res.json(JSON.parse(albums));
    }else{
        albums=await sql`SELECT * FROM albums`;
         //console.log("cache miss");
        if(redisClient.isReady){
            await redisClient.set("albums",JSON.stringify(albums),{
                EX:Cache_Exp
            })
        }
        res.json(albums);
    }
    
});

export const getAllSongs=TryCatch(async(req,res)=>{

    let songs;
    
    const Cache_Exp=1800;//half hour

    if(redisClient.isReady){
        songs=await redisClient.get("songs");
    }
    if(songs){
        // redis cache has albums
        console.log("cache hit");
        res.json(JSON.parse(songs));
    }else{
        songs=await sql `SELECT * FROM songs`;
        //console.log("cache miss");
        if(redisClient.isReady){
            await redisClient.set("songs",JSON.stringify(songs),{
                EX:Cache_Exp
            })
        }
        res.json(songs);
    }
})

export const getAllSongOfAlbum=TryCatch(async(req,res)=>{

    const {id}=req.params;

    let album,songs;

    const Cache_Exp=1800;//half hour

     if(redisClient.isReady){
        const cache_data=await redisClient.get(`album_songs_${id}`);
        if(cache_data){
            console.log("cache hit");
            return res.json(JSON.parse(cache_data));
        }
    }

    album=await sql`SELECT * FROM albums WHERE id=${id}`;
    if(album.length===0){
        return res.status(404).json({
            message:"No albums found"
        });
    }
    songs =await sql `SELECT * FROM songs WHERE album_id=${id}`;

    const response={songs,album:album[0]};
    if(redisClient.isReady){
        await redisClient.set(`album_songs_${id}`,JSON.stringify(response),{
            EX:Cache_Exp}
        );
    }
    res.json(response);
})

export const getSong=TryCatch(async(req,res)=>{

    const {id}=req.params;

    let song;
    song=await sql `SELECT * FROM songs WHERE id=${id}`;

    res.json(song[0]);

})

