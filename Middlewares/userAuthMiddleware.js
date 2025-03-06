import jwt from 'jsonwebtoken';

export const verifyUser = async (req, res, next) =>{
    const accessToken = req?.cookies?.userAccessToken;
    const refreshToken = req?.cookies?.userRefreshToken;

    if(accessToken){
      try{
            const decode = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
          
            const userId = decode.id;
            const userRole = decode.role;

            req.userId = userId;
            req.userRole = userRole;

           return next()
      }
      catch(error){
         return res.status(401).json({message : "You are not authorized , token incorrect failed"})
      }
           
    }
    else{
        handleRefreshToken(req,res,next,refreshToken);
    }
}

const handleRefreshToken = async(req,res,next,refreshToken) =>{
    if(refreshToken){
        try{
            const decodeRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const newAccessToken = jwt.sign({id : decodeRefresh?.id, role : decodeRefresh.role}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : "15m"});

            res.cookie("userAccessToken",newAccessToken,{
                httpOnly : false,
                secure   : false,
                sameSite : "Lax",
                maxAge   : 1 * 60 * 1000,
            });

            
            req.userId = decodeRefresh.id;
            req.userRole = decodeRefresh.role;
            next();
        }
        catch(errror){
             res.status(401).json({message : "Refresh token is invalid"});
             return;
        }
    }
    else{
        return res.status(401).json({message :"You are not logged in"});
    }
    
}