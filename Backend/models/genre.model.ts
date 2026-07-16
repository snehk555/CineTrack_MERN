import mongoose  from "mongoose";


const genreSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    }
});
export default mongoose.model('Genre', genreSchema)