import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    details: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
