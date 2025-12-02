import express  from "express";

import {addAlbums, addSongs, addThumbnail, deleteAlbum, deleteSong } from "./controller.js";

import uploadFile, {isAuth} from "./middleware.js";

const router=express.Router();

router.post('/albums/new', isAuth, uploadFile, addAlbums);

router.post('/song/new', isAuth, uploadFile, addSongs);

router.post('/song/:id',isAuth,uploadFile,addThumbnail);

router.delete('/albums/:id',isAuth,deleteAlbum);

router.delete('/song/:id',isAuth,deleteSong);


export default router;