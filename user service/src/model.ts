import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string,
    email: string,
    password: string,
    role: string,
    playlist: String[];
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true,
    },

    playlist: [
        {
            type: String,
            required: true,
        }
    ]

},{timestamps:true});

export const User=mongoose.model<IUser>('User',userSchema);

// export default User;