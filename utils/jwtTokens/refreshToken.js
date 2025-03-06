import jwt from "jsonwebtoken";

//generating user refresh token
export const generateUserRefreshToken = (res,user) =>{
    const token = jwt.sign(
        {id : user._id, role:user.role},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn : "7d"}
    )

    res.cookie("userRefreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ?true : false,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });
      
}

//generating admin refresh token
export const generateAdminRefreshToken = (res,user) =>{
    const token = jwt.sign(
        {id : user._id, role:user.role},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn : "7d"}
    )

    res.cookie("adminRefreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ?true : false,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });
      

}