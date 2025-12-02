import type { NextFunction, Request,Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { User, type IUser } from "./model.js";

export interface AuthenticatedRequest extends Request{
    user?:IUser|null
}

export const isAuth=async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
    try{
        const token=req.headers.token as string;
        if(!token){
            return res.status(401).json({
                message:"Unauthorized"
            });
        }
        console.log("Token:",token);

        const decoded=jwt.verify(token,process.env.JWT_SECRET as string) as JwtPayload;

        if(!decoded || !decoded._id){
            console.log("Invalid token decoded:");
            return res.status(401).json({
                message:"Unauthorized token or expired"
            });
        }

        console.log("Decoded token:");

        const userId=decoded._id;
        // password should not be selected

        const user=await User.findById(userId).select('-password');

        console.log("Authenticated user:",user);

        if(!user){
            return res.status(401).json({
                message:"Unauthorized user not found"
            });
        }

        req.user=user;
        next();
        
    }catch(err){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }
} 