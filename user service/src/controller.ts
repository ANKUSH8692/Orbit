
import bcrypt from "bcrypt";
import jwt  from "jsonwebtoken";

import {User} from "./model.js"

import TryCatch from "./TryCatch.js"
import type {AuthenticatedRequest} from "./middleware.js";

export const registerUser=TryCatch(async(req,res)=>{

    const {name,email,password}=req.body;
    let user=await User.findOne({
        email
    });

    if(user){
        return res.status(400).json({
            message:"User already exists",
            success:false
        });
    }
    
    const hashedPassword=await bcrypt.hash(password,10);

    user=await User.create({
        name,
        email,
        password:hashedPassword
    });
    
    const token =jwt.sign({_id:user._id},process.env.JWT_SECRET as string,{
        expiresIn:"4d"
    })

    return res.status(201).json({
        message:"User registered successfully",
        user,
        token
    });

});

export const loginUser=TryCatch(async(req,res)=>{
    const {email,password}=req.body;
    console.log(email,password);
    if(!email || !password){
        return res.status(400).json({
            message:"Please provide all the fields"
        })
    }

    const user=await User.findOne({
        email
    })

    if(!user){
        return res.status(404).json({
            message:"User not exists"
        })
    }

    const isMatch=await bcrypt.compare(password,user.password);

    if(!isMatch){
        return res.status(400).json({
            message:"Invalid credentials"
        })
    }
    
    const token =jwt.sign({_id:user._id},process.env.JWT_SECRET as string,{
        expiresIn:"2d"
    })

    return res.status(200).json({
        message:"User Login successfully",
        user,
        token
    });
})

export const myprofile=TryCatch(async(req:AuthenticatedRequest,res)=>{
    console.log("Inside myprofile controller, req.user:", req.user);
    const user=req.user;
    res.json(user);
})
