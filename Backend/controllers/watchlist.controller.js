import { Watchlist } from "../models/watchlist.model.js";

// 1. Movie adding to watchlist (mark watched)

export const addToWatchList = async (req, res) => {
     
      try{
         const {movieId} = req.body;
         const userId = req.user._id;

         // creating new watchlist entry 
         const newEntry = new Watchlist({
             userId,
             movieId,
             isWatched: true
         });

         await newEntry.save();
         
         // Return populated data so frontend gets 
         // movie details 

         await newEntry.populate({
    path: 'movieId',
    populate: ['category', 'genre']
});
         
         res.status(201).json({
            message: "Added to Watchlist",
            WatchingListing : newEntry
         })



      }
       catch (error){
        //if movie already added then mongodb give 11000 error code 
            if(error.code === 11000){
                 return res.status(400).json({
                     message: "movie is already in your Watchlist!"
                 })
            }
            res.status(500).json({
                 error: error.message
            })
       }
};

export const getUserWatchlist = async (req, res) => {
     try{
         const userId = req.user._id;
         // here we use nested populate 
         const watchlist = await Watchlist.find({userId})
         .populate({
             path: 'movieId',
              populate: ['category','genre']
         })
         res.status(200).json({ watchlist });
     }
     catch(error){
         res.status(500).json({
             error: error.message
         })
     }
}