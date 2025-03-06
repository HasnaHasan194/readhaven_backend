import ProductDB from "../../Models/productSchema.js";

export const getProducts = async (req,res,next) => {
    try{
        const products = await ProductDB.find();
        if(!products) return res.status(404).json({message :"no products"});

        return res.status(200).json({message:"products fetch successfully",products})
    }
    catch(error){
        return res.status(500).json({message:"internal server error"})
    }

}

//get a particular product
export const getProductDetails = async(req, res) =>{
    try{
         const {id} = req.params;

         const product = await ProductDB.findById(id)
          .populate("Category", "name");

          if(!product) {
            return res.status(404).json({message : "Product Not found"});
          }

          return res.status(200).json({
            message : "Product fetched Successfully",
            product,
          })
    }

    catch(error){
        console.error("Error fetching product details",error);
        return res.status(500).json({message : "Internal server error"});
    }
}


//get related products
export const getRelatedProducts = async (req, res) =>{
    try{
        const {category, exclude} = req.query;
       
        if(!category){
           return res.status(400).json({message : "Category is required"});
        }

        const products = await ProductDB.find({
            Category:category,
            _id : {$ne: exclude}
        })
         .populate("Category", "name");
     

         return res.status(200).json({
            message : "Related products fetched successfully",
            products,
         });

    }
    catch(error){
        console.log("Error fetching related products");
        res.status(500).json({message : "Internal server error"});
    }
}

export const getProductsForShop = async (req, res) => {
  
    const {
      page = 1,
      limit = 6, 
      searchQuery = "",
      category = "",
      priceRange = "",
      author = "",
      language = "",
      sortOption = "newest",
    } = req.query;
  
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
  
    let query = { isBlocked: false }; 
  
    
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { writer: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }
  
    
    if (category) {
      query.Category = category;
    }
  
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      query.regularPrice = { $gte: min, $lte: max };
    }
  
    
    if (author) {
      query.writer = { $regex: author, $options: "i" };
    }
  
    
    if (language) {
      query.language = language;
    }
  
    
    const sort = {};
    switch (sortOption) {
      case "newest":
        sort.createdAt = -1; 
        break;
      case "oldest":
        sort.publishedDate = 1; 
        break;
      case "price_asc":
        sort.regularPrice = 1; 
        break;
      case "price_desc":
        sort.regularPrice = -1; 
        break;
      case "rating_desc":
        sort.rating = -1; 
        break;
      default:
        sort.createdAt = -1; 
    }
  
    
    const products = await ProductDB.find(query)
      .populate("Category", "name") 
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
      
    const total = await ProductDB.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
  
    
    const productsWithEffectivePrice = products.map((product) => {
      let effectivePrice = product.regularPrice;
      if (product.salePrice > 0) {
        effectivePrice = product.salePrice;
      } else if (product.productOffer > 0) {
        effectivePrice = product.regularPrice * (1 - product.productOffer / 100);
      }
      return {
        ...product,
        effectivePrice: Number(effectivePrice.toFixed(2)), 
      };
    });

    let currPageNum = pageNum
    if(searchQuery || author) {
        currPageNum = 1
    }
  

    res.status(200).json({
      success: true,
      products: productsWithEffectivePrice,
      totalPages,
      currentPage: currPageNum,
      totalProducts: total,
    });
}