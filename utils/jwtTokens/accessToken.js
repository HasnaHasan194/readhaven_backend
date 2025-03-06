import jwt from "jsonwebtoken"
//generating user access token
export const generateUserAccessToken=(res,user)=>{
    const token=jwt.sign(
        {id : user._id, role :user.role},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn : "15m"}
    );
    res.cookie("userAccessToken", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
        maxAge: 15 * 60 * 1000, 
        });


}

//generating admin access token
export const generateAdminAccessToken=(res,user)=>{
    const token=jwt.sign(
        {id:user._id, role :user.role},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn : "15m"}
    );

    res.cookie("adminAccessToken",token,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:process.env.NODE_ENV==="production" ? "None" :"strict",
        maxAge :15 * 60 * 1000, 
    });
}