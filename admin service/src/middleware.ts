import type { NextFunction, Request, Response } from "express";

import dotenv from "dotenv";
import axios from "axios";
import multer from "multer";

dotenv.config();

//typescript interface for user object
interface IUser {
    id: string;
    name: string;
    email: string;
    role: string;
    password?: string;
    playlists: string[];
}

interface AuthenticationRequest extends Request {
    user?: IUser | null;

}

export const isAuth = async (
    req: AuthenticationRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.token as string;
  
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Please Login"
            });
            return;

        }
 
        const { data } = await axios.get(`${process.env.User_url}/api/v1/user/me`, {
            headers: {
                token
            },
        });

        req.user = data;

        next();
    } catch (err) {
        res.status(403).send({
            success: false,
            message: err
        })
    }
};

//multer setup for file upload


const storage = multer.memoryStorage();

const uploadFile = multer({ storage }).single("file");

export default uploadFile ;