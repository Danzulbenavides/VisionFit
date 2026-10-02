import mongoose from "mongoose";
import Address from "../models/Address.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  SERVICE_AREA,
  DAGUPAN_BARANGAYS,
  OUTSIDE_SERVICE_AREA_MESSAGE,
  findBarangay,
  isDagupanCity,
} from "../utils/serviceArea.js";

export const getServiceArea = asyncHandler(async (req, res) => {
  return res.status(200).json({
    data: { ...SERVICE_AREA, barangays: DAGUPAN_BARANGAYS },
    error: null,
  });
});

export const createAddress = asyncHandler(async (req, res) => {
    const { firstName,
       lastName, 
       street, 
       apartment, 
       barangay, 
       phone, 
       isDefault 
      } =
    req.body;

    const requiredFields = [
      "firstName", 
      "lastName", 
      "street", 
      "barangay", 
      "phone"
    ];

  const missingFields = requiredFields.filter((field) => {
    const value = req.body[field];

    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      `Required fields missing: ${missingFields.join(", ")}`,
    );
  }

    if (req.body.city && !isDagupanCity(req.body.city)) {
    throw new ApiError(400, OUTSIDE_SERVICE_AREA_MESSAGE);
  }

  const canonicalBarangay = findBarangay(barangay);

  if (!canonicalBarangay) {
    throw new ApiError(
      400,
      "Please choose a valid barangay in Dagupan City. We only deliver within Dagupan City.",
    );
  }

  if (isDefault === true) {
    await Address.updateMany(
      {
        userId: req.user.userId,
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );
  }

  const existingAddress = await Address.findOne({
    userId: req.user.userId,
  });

  const address = await Address.create({
    userId: req.user.userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    street: street.trim(),
    apartment: apartment?.trim() || null,
    phone: phone.trim(),
    barangay: canonicalBarangay,
    city: SERVICE_AREA.city,
    province: SERVICE_AREA.province,
    country: SERVICE_AREA.country,
    postalCode: SERVICE_AREA.postalCode,
    isDefault: existingAddress === null ? true : isDefault === true,
  });

  return res.status(201).json({
    data: address,
    error: null,
  });
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({
    userId: req.user.userId,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return res.status(200).json({
    data: addresses,
    error: null,
  });
});

export const getAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const address = await Address.findOne({
    _id: id,
    userId: req.user.userId,
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return res.status(200).json({
    data: address,
    error: null,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "street",
    "apartment",
    "phone",
    "isDefault",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] =
        typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
    }
  }
    if (req.body.barangay !== undefined) {
    if (req.body.city && !isDagupanCity(req.body.city)) {
      throw new ApiError(400, OUTSIDE_SERVICE_AREA_MESSAGE);
    }

    const canonicalBarangay = findBarangay(req.body.barangay);

    if (!canonicalBarangay) {
      throw new ApiError(400, "Please choose a valid barangay in Dagupan City.");
    }

    updates.barangay = canonicalBarangay;
    updates.city = SERVICE_AREA.city;
    updates.province = SERVICE_AREA.province;
    updates.country = SERVICE_AREA.country;
    updates.postalCode = SERVICE_AREA.postalCode;
  }

  if (updates.isDefault === true) {
    await Address.updateMany(
      {
        userId: req.user.userId,
        _id: { $ne: id },
        isDefault: true,
      },
      {
        $set: {
          isDefault: false,
        },
      },
    );
  }

  const address = await Address.findOneAndUpdate(
    {
      _id: id,
      userId: req.user.userId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return res.status(200).json({
    data: address,
    error: null,
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const address = await Address.findOneAndDelete({
    _id: id,
    userId: req.user.userId,
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (address.isDefault) {
    const replacement = await Address.findOne({
      userId: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return res.status(200).json({
    data: {
      message: "Address deleted successfully",
    },
    error: null,
  });
});
