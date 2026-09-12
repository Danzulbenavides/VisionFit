const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // User must already be authenticated
    if (!req.user) {
      return res.status(401).json({
        data: null,
        error: {
          message: "Authentication required",
        },
      });
    }

    // Check user's role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        data: null,
        error: {
          message: "You do not have permission to perform this action",
        },
      });
    }

    next();
  };
};

export default requireRole;
