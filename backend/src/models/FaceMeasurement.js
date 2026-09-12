import mongoose from "mongoose";

const faceMeasurementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    faceShape: {
      type: String,
      required: true,
      enum: ["OVAL", "ROUND", "SQUARE", "HEART"],
    },

    pupilDistance: {
      type: Number,
      required: true,
      min: 20,
      max: 90,
    },

    faceWidth: {
      type: Number,
      required: true,
      min: 50,
      max: 300,
    },

    faceLength: {
      type: Number,
      required: true,
      min: 50,
      max: 300,
    },

    scanImageUrl: {
      type: String,
      default: null,
      trim: true,
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
    collection: "faceMeasurements",
  },
);

faceMeasurementSchema.index({
  userId: 1,
  createdAt: -1,
});

const FaceMeasurement = mongoose.model(
  "FaceMeasurement",
  faceMeasurementSchema,
);

export default FaceMeasurement;
