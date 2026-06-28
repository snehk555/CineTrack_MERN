import jwt from 'jsonwebtoken'

export const generateTokenAndSetCookie = (userId, res) => {
     // 1. Id card (token ) making in which user _id is hide 
     const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '15d' // token expires in 15 days
     });

     // 2. Token set in cookie 
     res.cookie("jwt", token, {
         maxAge: 15*24*60*60*1000,  // 15 days in milliseconds
         httpOnly: true, // xss aatacks avoiding , and brower js cannot read it 
         sameSite: "strict", // CSRF aatacks handling
        //  secure: process.env.NODE_ENV !== "developement", // if in production then works in https only
        secure: false
     });

     return token;
}