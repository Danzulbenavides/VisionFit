import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { validateObjectId, requireFields } from "../utils/validation.js";

export const getProducts = asyncHandler(async (req, res) => {
  const {
    search = "",
    category,
    frameShape,
    material,
    genderCategory,
    minPrice,
    maxPrice,
    minStock,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }

  const filter = {
    isActive: true,
  };

  if (search.trim()) {
    const safeSearch = search.trim();

    filter.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        brand: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (frameShape) {
    filter.frameShape = frameShape;
  }

  if (material) {
    filter.material = material;
  }

  if (genderCategory) {
    filter.genderCategory = genderCategory;
  }

  if (minPrice !== undefined) {
    const value = Number(minPrice);

    if (!Number.isFinite(value) || value < 0) {
      throw new ApiError(400, "Invalid minimum price");
    }

    filter.price = {
      ...filter.price,
      $gte: value,
    };
  }

  if (maxPrice !== undefined) {
    const value = Number(maxPrice);

    if (!Number.isFinite(value) || value < 0) {
      throw new ApiError(400, "Invalid maximum price");
    }

    filter.price = {
      ...filter.price,
      $lte: value,
    };
  }

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    Number(minPrice) > Number(maxPrice)
  ) {
    throw new ApiError(
      400,
      "Minimum price cannot be greater than maximum price",
    );
  }

  if (minStock !== undefined) {
    const value = Number(minStock);

    if (!Number.isInteger(value) || value < 0) {
      throw new ApiError(400, "Invalid minimum stock");
    }

    filter.stock = {
      $gte: value,
    };
  }

  const sortOptions = {
    newest: {
      createdAt: -1,
    },

    oldest: {
      createdAt: 1,
    },

    price_asc: {
      price: 1,
    },

    price_desc: {
      price: -1,
    },

    name_asc: {
      name: 1,
    },

    name_desc: {
      name: -1,
    },

    stock_asc: {
      stock: 1,
    },

    stock_desc: {
      stock: -1,
    },
  };

  if (!sortOptions[sort]) {
    throw new ApiError(400, "Invalid sort option");
  }

  const skip = (parsedPage - 1) * parsedLimit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOptions[sort]).skip(skip).limit(parsedLimit),

    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return res.status(200).json({
    data: {
      products,

      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPreviousPage: parsedPage > 1,
      },

      filters: {
        search: search.trim() || null,
        category: category || null,
        frameShape: frameShape || null,
        material: material || null,
        genderCategory: genderCategory || null,
        minPrice: minPrice !== undefined ? Number(minPrice) : null,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : null,
        minStock: minStock !== undefined ? Number(minStock) : null,
        sort,
      },
    },

    error: null,
  });
});

export const getProductById = async (req, res) => {
  try {
    validateObjectId(req.params.id, "product ID");

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        data: null,
        error: {
          message: "Product not found",
        },
      });
    }

    return res.status(200).json({
      data: product,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 400).json({
      data: null,
      error: {
        message: error.message || "Failed to get product",
      },
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    validateObjectId(req.params.id, "product ID");

    const allowedFields = [
      "name",
      "brand",
      "description",
      "price",
      "stock",
      "category",
      "frameShape",
      "material",
      "genderCategory",
      "imageUrl",
      "images",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "At least one valid product field is required");
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        data: null,
        error: {
          message: "Product not found",
        },
      });
    }

    return res.status(200).json({
      data: product,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 400).json({
      data: null,
      error: {
        message: error.message || "Failed to update product",
      },
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      data: product,
      error: null,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      data: null,
      error: {
        message: "Failed to create product",
      },
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    validateObjectId(req.params.id, "product ID");

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        isActive: true,
      },
      {
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        data: null,
        error: {
          message: "Product not found",
        },
      });
    }

    return res.status(200).json({
      data: product,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 400).json({
      data: null,
      error: {
        message: error.message || "Failed to delete product",
      },
    });
  }
};
