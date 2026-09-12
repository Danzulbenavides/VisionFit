import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "favorites",
  },
);

// Prevent the same user from favoriting
// the same product more than once.
favoriteSchema.index(
  {
    userId: 1,
    productId: 1,
  },
  {
    unique: true,
  },
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
