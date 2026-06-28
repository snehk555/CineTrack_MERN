import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next ) => {
     try{
           // checking that can browser send any cookie or not ? 
           const token = req.cookies.jwt;

           if(!token){
             return res.status(401).json({
                error: "Unauthorized access "
             })
           }
           // step 2: is token fake or not check in secret key and
           // jwt.verify open the the whole jasia pahle tha uske pass mein , 
           // and 
           const decodToken = jwt.verify(token, process.env.JWT_SECRET);

           if(!decodToken){
               return res.status(401).json({
                error: "Unauthorized access"
               })
           }
           // step 3:  find user in database by id which is in token 
           const user = await User.findById(decodToken.userId).select("-password");
           if(!user){
             return res.status(404).json({
                error: "User not found in Database"
             })
           }
           // step 4: now all done send user to req object 
           req.user  = user;
           // step 5: calling next(): means "security checked pass now move on to controllers";
           next();

     }
     catch(error){
         return res.status(500).json({
             error: "internal server error"
         })
     }
}