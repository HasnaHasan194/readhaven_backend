import { STATUS_CODES } from "../utils/constants.js";

export const requireUserRole = async (req, res, next) => {
  if (req.userRole !== "user") {
    return res
      .status(STATUS_CODES.FORBIDDEN)
      .json({ message: "Access denied. Users only." });
  }
  next();
};