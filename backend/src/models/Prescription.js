import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/fieldEncryption.js";

const prescriptionEyeSchema = new mongoose.Schema(
  {
    sph: {
      type: mongoose.Schema.Types.Mixed,
      required: true,

      set: encryptField,

      get: decryptField,
    },
    cyl: {
      type: mongoose.Schema.Types.Mixed,
      required: true,

      set: encryptField,

      get: decryptField,
    },

    axis: {
      type: mongoose.Schema.Types.Mixed,
      required: true,

      set: encryptField,

      get: decryptField,
    },

    add: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,

      set: encryptField,

      get: decryptField,
    },
  },
  {
    _id: false,
  },
);

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    prescriptionType: {
      type: String,
      required: true,
      enum: ["SINGLE_VISION", "PROGRESSIVE", "READING", "NON_PRESCRIPTION"],
    },

    OD: {
      type: prescriptionEyeSchema,
      required: true,
    },

    OS: {
      type: prescriptionEyeSchema,
      required: true,
    },

    pd: {
      type: mongoose.Schema.Types.Mixed,
      required: true,

      set: encryptField,

      get: decryptField,
    },

    hasPrism: {
      type: Boolean,
      default: false,
    },

    prescriptionImageUrl: {
      type: String,
      default: null,
      trim: true,
    },

    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,

    toJSON: {
      getters: true,
    },

    toObject: {
      getters: true,
    },
  },
);

prescriptionSchema.index({
  userId: 1,
  createdAt: -1,
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
