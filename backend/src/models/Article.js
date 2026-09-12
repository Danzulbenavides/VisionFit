import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "PRESCRIPTIONS",
        "EYE_CARE",
        "FRAME_GUIDE",
        "LENS_GUIDE",
        "FACE_SHAPE",
      ],
      index: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    content: {
      type: String,
      required: true,
    },

    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "articles",
  },
);

articleSchema.index({
  isPublished: 1,
  category: 1,
  createdAt: -1,
});

const Article = mongoose.model("Article", articleSchema);

export default Article;
