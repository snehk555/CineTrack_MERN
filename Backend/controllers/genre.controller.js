  import Genre from '../models/genre.model.js'

  
 export const addGenre = async (req ,res) => {
     try{
              const {name} = req.body;


              const newGenre = new Genre({
                 name: name
              })

              await newGenre.save();
              
              res.status(200).json({
                 message: "genre is added successfully ",
                 Genre: newGenre
              });
              
              }
     

     catch(error){
         res.status(500).json({
            message: "Error is ", error: error.message
         })
     }
}

export const getGenre = async (req, res) => {
         try{
              const genres = await Genre.find();
              res.status(200).json(genres);
         }
         catch(error){
             res.status(500).json({
                 message: "Error adding category", 
                 error: error.message
             })
         }
}