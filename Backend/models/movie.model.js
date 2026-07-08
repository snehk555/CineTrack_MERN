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
          
            category:{
                type: mongoose.Schema.Types.ObjectId, // this is taking the object id for reference which is another document
                ref: 'Category',
                required: true

            },
            genre:[{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Genre'
            }],

         

            
}, {timestamps: true})

export default mongoose.model("Movie", movieSchema)