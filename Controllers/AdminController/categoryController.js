import CategoryDB from "../../Models/categorySchema.js";
//fetch category
export const getCategory=async (req,res)=>{
    try{
        const page=parseInt(req.query.page) || 1;
        const limit=parseInt(req.query.limit) || 5;
        const skip=(page-1)*limit;
        const totalCategory=await CategoryDB.countDocuments();
        const categories=await CategoryDB.find().sort({createdAt :-1}).skip(skip).limit(limit);
        return res.status(200).json({
            message:"categories fetched successfully",
            categories:categories,
            totalPages:Math.ceil(totalCategory/limit),
            currentPage:page,
        });
    }catch(error){
        return res.status(500).json({message :"internal server error"});

    }
    
}

//function  to add category
export const addCategory=async(req,res)=>{
    try{
        const {name,description}=req.body;
        if(!name || !description){
            return res.status(400).json({message:"Name and description required"});
        }
       
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ message: "Category name must contain only alphabets and spaces" });
        }

        const existingCategory = await CategoryDB.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
        });
        if(existingCategory){
            return res.status(400).json({message :"category already exists"})
        }
        const newCategory = new CategoryDB({
            name,
            description
        });

        await newCategory.save();
        return res.status(200).json({message : "Category Added successfully", category : newCategory})

    }catch(error){
        if(error.code ===11000){
            return res.status(400).json({message:"Category already exists"});
        }
        console.log("error in adding category ",error);
        return res.status(500).json({message:"Internal server error"});
    }
}

//unlist or list the category
export const blockCategory=async(req,res)=>{
    const categoryId=req.params.id;
    try{
        const category=await CategoryDB.findById(categoryId);
        if(!category){
            return res.status(401).json({message:"Category not found"});

        }
        category.isActive=!category.isActive;
        await category.save();
        return res.status(200).json({message:`${category.name } has been ${category.isActive} ? "blocked" : "unblocked"`});

    }
    catch(error){
        return res.status(500).json({message:"internal server error.please try again"})
    }
}
//Edit category
export const editCategory=async(req,res)=>{
    try{
        const {id}=req.params;
        const{name,description}=req.body;
        if(!name || !description){
            return res.status(400).json({message:"Name and description are required "});
 }
    const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ message: "Category name must contain only alphabets and spaces" });
        }
        const existingCategory=await CategoryDB.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
        });
        if(existingCategory){
            return res.status(400).json({message :"category already exists"})
        }
        const updateCategory = await CategoryDB.findByIdAndUpdate(
            id,
            { name, description }, 
            { new: true } 
            );

            if(!updateCategory){
            return res.status(404).json({message : "Category Not found"})
            }

        return res.status(200).json({
            message : "Category updated successfully",
            category : updateCategory
        })
    }
    catch(error){
        return res.status(500).json({message : "internal server error"});
    }
}
                                                                                                            