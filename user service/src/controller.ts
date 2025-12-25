
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "./model.js"

import TryCatch from "./TryCatch.js"
import type { AuthenticatedRequest } from "./middleware.js";

export const registerUser = TryCatch(async (req, res) => {

    const { name, email, password } = req.body;
    let user = await User.findOne({
        email
    });

    if (user) {
        return res.status(400).json({
            message: "User already exists",
            success: false
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hashedPassword
    });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string, {
        expiresIn: "4d"
    })

    return res.status(201).json({
        message: "User registered successfully",
        user,
        token
    });

});

export const loginUser = TryCatch(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide all the fields"
        })
    }

    const user = await User.findOne({
        email
    })

    if (!user) {
        return res.status(404).json({
            message: "User not exists"
        })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid credentials"
        })
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string, {
        expiresIn: "2d"
    })

    return res.status(200).json({
        message: "User Login successfully",
        user,
        token
    });
})

export const myprofile = TryCatch(async (req: AuthenticatedRequest, res) => {

    const user = req.user;
    res.json(user);
})

export const addToPlayList = TryCatch(async (req: AuthenticatedRequest, res) => {

    const userId = req.user?._id;
    const songId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    if (!songId) {
        return res.status(400).json({
            message: "Please provide songId"
        })
    }

    if (user?.playlist.includes(songId)) {

        const index = user.playlist.indexOf(songId);

        user.playlist.splice(index, 1);

        await user?.save();
        return res.status(200).json({
            message: "Song removed from playlist"
        })
    }

    user?.playlist.push(songId);

    await user?.save();
    
    return res.status(200).json({
        message: "Song added to playlist",
        playlist: user?.playlist
    });
    


});

export const addAlbumToPlayList = TryCatch(async (req: AuthenticatedRequest, res) => {

    const userId = req.user?._id;
    const albumId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }
    if (!albumId) {
        return res.status(400).json({
            message: "Please provide albumId"
        })
    }
    if (user?.playlist.includes(albumId)) {
        const index = user.playlist.indexOf(albumId);
        user.playlist.splice(index, 1);
        await user?.save();
        return res.status(200).json({
            message: "Album removed from playlist"
        })
    }
    user?.playlist.push(albumId);
    await user?.save();
    return res.status(200).json({
        message: "Album added to playlist",
        playlist: user?.playlist
    });
});

export const updateProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    if (name) user.name = name;
    if (email) user.email = email;

    if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
    }   
    await user.save();

    return res.status(200).json({
        message: "Profile updated successfully",
        user
    });
});