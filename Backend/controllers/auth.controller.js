 import bcryptjs from 'bcryptjs'
import User from '../models/user.model.js'
import { generateTokenAndSetCookie } from '../utils/generateToken.js';


export const signUp = async (req, res) => {
     try{
           const {name , email , password} = req.body;
    // step 1 for checking if any field is empty or not 
           if(!name || !email || !password) {
             return res.status(400).json({
                error: "All fields are required"
             });
           }



           //step 2:  checking if user is already present or not 
           
           const existingUser = await User.findOne({email});
           if(existingUser) {
             return res.status(400).json({
                 error: "User already exists with this email"
             });
           };

           //step 3: password hashing using bcryptjs

           const encryptPassword = await bcryptjs.genSalt(10);  // 10 rounds of encryption 
           const hashedPassword = await bcryptjs.hash(password, encryptPassword);
           
        //    step 4: new User model  making by hashedPassword 

        const newUser = new User({
             name, 
             email,
             password: hashedPassword
        }) ;


        // step 5: saving in database
        await newUser.save();
        generateTokenAndSetCookie(newUser._id, res);



           return res.status(200).json({
            message: "User registered successfully!",

            // this new "user" is created because if we send the data like res.json({user: newUser}) then whole object is sent to frontend with password so we need to make a differnet object for frontend to show user login details like email, name , etc.. 
            user:{
                 _id: newUser._id,
                 name: newUser.name,
                 email: newUser.email
            }
           });
     }
     catch (error){
         return res.status(500).json({
             error: error.message
         })
     }
}

export const login = async (req , res)  => {
     
  try{


    const { email , password} = req.body;
   // step 1: Checking in database is user email present or not

  const user = await User.findOne({email});
  //step 2: If user not exist then email is wrong :
   if(!user){
       return res.status(400).json({
             error: "Invalid email or password"
       })
   }

   // step 3 : checking password : 
   const isPasswordCorrect = await bcryptjs.compare(password, user.password);

   // step 4: if password is not correct :
   if(!isPasswordCorrect){
    return res.status(400).json({
      error: "Invalid email or password"
    });
   }

   // step 5: Email and password both are correct now new token creating

   generateTokenAndSetCookie(user._id, res)

               return res.status(200).json({
                 message: "logged  in successfully !", 
                 user: {
                   _id: user._id,
                   name: user.name,
                   email: user.email
                 }
               })
          }
          catch(error){
             return res.status(500).json({
                 message: error.message
             })
          }
}

export const logout = async (req, res) => {

           try{
            // cookie is blanked and maxAge set is 0 
            res.cookie("jwt", "", { maxAge: 0 });
        
        return res.status(200).json({
            message: "Logged out successfully!"
        });
           }

           catch(error){

           return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
               
           }
}

// for aurth check because browser and  react behaves diffrently 
export const authCheck = async (req, res) => {
   try{
       // protectRoute middleware already check the cookie and verify
       // the req.user and this req.user is present in whole backend 
       // until new req is comin

       res.status(200).json({
          user: {
             _id: req.user._id,
             name: req.user.name,
             email: req.user.email
          }
       });
       
   }
   catch(error){
          res.status(500).json({
            error: error.message
          })
   }
}