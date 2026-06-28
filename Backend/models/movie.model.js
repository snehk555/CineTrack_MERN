import mongoose  from "mongoose";


const movieSchema = new mongoose.Schema({
            title:{
                type: String,
                required: true  // title must be required 
            },
            poster:{
                type: String,  // image link 
               
            },
            year:{
                type: String,
                required: true
            },
            rating:{
                type: Number,
                default: 0  
            },
            isWatched:{
                type: Boolean,
                default: false // in starting movie is unwatched;
            },
            category:{
                type: mongoose.Schema.Types.ObjectId, // this is taking the object id for reference which is another document
                ref: 'Category',
                required: true

            },
            genre:[{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Genre'
            }],

            userId: {
                 type: mongoose.Schema.Types.ObjectId,
                 ref: "User", // matches User model name in user.model.js
                 required: true
            }
        

            
}, {timestamps: true})

export default mongoose.model("movie", movieSchema)