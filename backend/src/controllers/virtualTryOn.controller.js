import mongoose from "mongoose";

import Product from "../models/Product.js";

import { createVirtualTryOn } from "../services/virtualTryOn.service.js";

export const virtualTryOn = async (req, res) => {
  try {
    console.log("========================================");
    console.log("VIRTUAL TRY-ON REQUEST RECEIVED");
    console.log("========================================");

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid product ID.",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        data: null,
        error: {
          message: "A face photo is required.",
        },
      });
    }

    console.log("VTO product:", productId);

    console.log("VTO filename:", req.file.originalname);

    console.log("VTO mimetype:", req.file.mimetype);

    console.log("VTO size:", req.file.size);

    if (!["image/jpeg", "image/jpg"].includes(req.file.mimetype)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Only JPEG images are supported for Virtual Try-On.",
        },
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        data: null,
        error: {
          message: "Product not found or inactive.",
        },
      });
    }

    if (!product.tryOnImage) {
      return res.status(400).json({
        data: null,
        error: {
          message:
            "This product does not have a Virtual Try-On image configured.",
        },
      });
    }

    console.log("VTO product found:", product.name);

    const result = await createVirtualTryOn({
      imageBuffer: req.file.buffer,

      product,
    });

    const imageBase64 = result.imageBuffer.toString("base64");

    return res.status(200).json({
      data: {
        image: `data:image/jpeg;base64,${imageBase64}`,

        mimeType: result.mimeType,

        width: result.width,

        height: result.height,

        detectionScore: result.detectionScore,

        face: result.face,

        frame: result.frame,

        product: {
          _id: product._id,

          name: product.name,

          brand: product.brand,

          frameShape: product.frameShape,

          price: product.price,
        },
      },

      error: null,
    });
  } catch (error) {
    console.error("========================================");

    console.error("VIRTUAL TRY-ON ERROR:", error);

    console.error("VIRTUAL TRY-ON ERROR MESSAGE:", error?.message);

    console.error("========================================");

    return res.status(500).json({
      data: null,
      error: {
        message: error?.message || "Unable to create Virtual Try-On image.",
      },
    });
  }
};
