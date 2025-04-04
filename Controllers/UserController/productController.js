import CategoryDB from "../../Models/categorySchema.js";
import ProductDB from "../../Models/productSchema.js";
import { STATUS_CODES } from "../../utils/constants.js";

export const getProducts = async (req, res) => {
  try {
    const products = await ProductDB.find();
    if (!products) return res.status(STATUS_CODES.NOT_FOUND).json({ message: "no products" });

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "products fetch successfully", products });
  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES. SERVER_ERROR).json({ message: "internal server error" });
  }
};

//get a particular product
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductDB.findById(id).populate("Category", "name");

    product.salePrice = product.regularPrice * (1 - product.productOffer / 100);

    await product.save();

    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Product Not found" });
    }

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Product fetched Successfully",
      product,
    });
  } catch (error) {
    console.error("Error fetching product details", error);
    return res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Internal server error" });
  }
};

//get related products
export const getRelatedProducts = async (req, res) => {
  try {
    const { category, exclude } = req.query;

    if (!category) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Category is required" });
    }

    const products = await ProductDB.find({
      Category: category,
      _id: { $ne: exclude },
    }).populate("Category", "name");

    return res.status(STATUS_CODES.SUCCESS).json({
      message: "Related products fetched successfully",
      products,
    });
  } catch (error) {
    console.log(error)
    console.log("Error fetching related products");
    res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Internal server error" });
  }
};

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

  // Search query across multiple fields
  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: "i" } },
      { writer: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
    ];
  }

  // Category filter - Lookup Category by name and get ObjectId
  if (category) {
    console.log('category =>', category)
    try {
      const categoryDoc = await CategoryDB.findOne({
        name: { $regex: category, $options: "i" }, // Case-insensitive exact match
      });

      console.log('categoryDoc =>', categoryDoc)

      if (categoryDoc) {
        query.Category = categoryDoc._id; // Use the ObjectId
      } else {
        // If category doesn't exist, return no results
        return res.status(STATUS_CODES.SUCCESS).json({
          success: true,
          products: [],
          totalPages: 0,
          currentPage: pageNum,
          totalProducts: 0,
        });
      }
    } catch (error) {
      console.error("Error finding category:", error);
      return res
        .status(STATUS_CODES. SERVER_ERROR)
        .json({ success: false, message: "Error processing category filter" });
    }
  }

  // Price range filter
  if (priceRange) {
    const [min, max] = priceRange.split("-").map(Number);
    query.regularPrice = { $gte: min, $lte: max };
  }

  // Author filter
  if (author) {
    query.writer = { $regex: author, $options: "i" };
  }

  // Language filter - Handle multiple languages
  if (language) {
    const languageArray = language.split(",").map((lang) => lang.trim());
    query.language = { $in: languageArray };
  }

  // Sorting logic
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

  console.log('this is the query ==>', JSON.stringify(query))
  // Fetch products
  const products = await ProductDB.find(query)
    .populate("Category", "name")
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await ProductDB.countDocuments(query);
  const totalPages = Math.ceil(total / limitNum);

  // Calculate effective price for each product
  // const productsWithEffectivePrice = products.map((product) => {
  //   let effectivePrice = product.regularPrice;
  //   if (product.regularPrice > 0) {
  //     effectivePrice = product.regularPrice;
  //   }
  //   if (product.productOffer > 0) {
  //     effectivePrice = product.regularPrice * (1 - product.productOffer / 100);
  //   }
  //   return {
  //     ...product,
  //     effectivePrice: Number(effectivePrice.toFixed(2)),
  //   };
  // });

  // Reset page number to 1 if searchQuery or author is present
  let currPageNum = pageNum;
  if (searchQuery || author) {
    currPageNum = 1;
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    products,
    totalPages,
    currentPage: currPageNum,
    totalProducts: total,
  });
};
