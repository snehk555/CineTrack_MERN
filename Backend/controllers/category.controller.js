import Category from "../models/category.model.js";

// adding new movie function 

export const addCategory = async (req,res) => {
     try{
         const { name } = req.body;

         // checking validation if name has come or not 
         if(!name) {
             return res.status(400).json({
                message: "Category name is required!"
             });
         }

         // new category creation 

         const newCategory = new Category({
            name: name
         })

         await newCategory.save();

         res.status(201).json({
            message: "Category added sucessfully!",
            Category: newCategory
         })
     }
     catch(error) {
           res.status(500).json({
            message: "Error adding category", error: error.message
           });
     }
};


export const getCategories = async (req, res) => {
     try{
        const categories = await Category.find();
        res.status(200).json(categories);

     }

     catch(error){
        res.status(500).json({
            message: "Error fetching categories"
        });
     }
}

