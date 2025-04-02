import userDB from "../../Models/userSchema.js";
import walletDB from "../../Models/walletSchema.js";
import { refreshTokenDecoder } from "../../utils/jwtTokens/decodeRefreshToken.js";
import { STATUS_CODES } from "../../utils/constants.js";

//get user details
export const getUserProfile = async (req, res) => {
  try {
    const id = refreshTokenDecoder(req);
    const userDetails = await userDB.findOne({ _id: id });
    const walletBalance = await walletDB.findOne({ userId: id });

    if (!userDetails) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found " });
    }
    return res
      .status(STATUS_CODES.SUCCESS)
      .json({
        message: "user details fetched successfully ",
        userDetails: {
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          email: userDetails.email,
          phone: userDetails.phone,
          usedCoupons: userDetails.usedCoupons,
          profileImage: userDetails.profileImage,
          walletBalance: walletBalance.balance,
          referralCode : userDetails.referralCode
        },
      });
  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES. SERVER_ERROR).json({ message: "internal server error" });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { firstName, lastName, email, phone, profileImage } = req.body;
    console.log(req.body);

    // Find the user by ID
    let user = await userDB.findById(userId);

    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    const existingPhone = await userDB.findOne({ phone, _id: { $ne: userId } });

    if (existingPhone) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Mobile Number already exists" });
    }

    // Update user details with the provided data or keep the existing values
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.profileImage = profileImage || user.profileImage;

    await user.save();

    return res.status(STATUS_CODES.SUCCESS).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.log(error)
    return res.status(STATUS_CODES. SERVER_ERROR).json({ message: "Internal server error" });
  }
};
