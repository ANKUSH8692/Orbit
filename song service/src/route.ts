import express from "express";
import { getAllAlbum, getAllSongOfAlbum, getAllSongs,getSong} from "./controller.js";

const router = express.Router();

router.get("/album/all",getAllAlbum);

router.get("/songs/all",getAllSongs);

router.get("/album/:id",getAllSongOfAlbum);

router.get("/song/:id",getSong);



export default router;