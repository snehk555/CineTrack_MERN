import mongoose from "mongoose";

const userSchma = new mongoose.Schema({
                 
    name: {
         type: String,
         required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,

    },

    password:{
        type: String,
         required: true, // only for checking if any user go to phone then by otp login can done 
        //  unique: true  
    }
         
},{timestamps: true})

export default mongoose.model("User", userSchma)