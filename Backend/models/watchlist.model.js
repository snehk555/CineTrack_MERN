import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
    userId:{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
        required: true
    },
    movieId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
          
    },
    isWatched: {
         type: Boolean,
         default: false
    }
},{ timestamps: true})

// unique compound index that by mistake user can't put moive in list
// many times 

watchlistSchema.index({userId: 1, movieId: 1},{unique: true})

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);