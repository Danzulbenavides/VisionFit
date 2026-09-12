import User from "../models/User.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.userId,
      isActive: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        data: null,
        error: {
          message: "User not found",
        },
      });
    }

    return res.status(200).json({
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      data: null,
      error: {
        message: "Failed to retrieve user",
      },
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-passwordHash").sort({
      createdAt: -1,
    });

    return res.status(200).json({
      data: users,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      data: null,
      error: {
        message: "Failed to retrieve users",
      },
    });
  }
};
