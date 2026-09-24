import AuditLog from "../models/AuditLog.js";
import ApiError from "../utils/ApiError.js";

export const recordAuditLog = async ({
  adminId,
  action,
  resourceType,
  resourceId = null,
  details = "",
}) => {
  if (!adminId) {
    throw new ApiError(400, "Admin ID is required for audit logging.");
  }

  if (!action) {
    throw new ApiError(400, "Audit action is required.");
  }

  if (!resourceType) {
    throw new ApiError(400, "Audit resource type is required.");
  }

  return AuditLog.create({
    adminId,
    action,
    resourceType,
    resourceId,
    details,
  });
};

export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find()
    .populate("adminId", "firstName lastName email role")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return res.status(200).json({
    data: logs,
    error: null,
  });
};
