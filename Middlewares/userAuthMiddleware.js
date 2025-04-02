import jwt from 'jsonwebtoken';
import { STATUS_CODES } from '../utils/constants.js';

export const verifyUser = async (req, res, next) =>{
    const accessToken = req?.cookies?.userAccessToken;
    const refreshToken = req?.cookies?.userRefreshToken;

    if(accessToken){
      try{
            const decode = jwt.verify(accessToken,globalThis.process.env.ACCESS_TOKEN_SECRET);
          
            const userId = decode.id;
            const userRole = decode.role;

            req.userId = userId;
            req.userRole = userRole;

           return next()
      }
      catch(error){
        console.log(error)
         return res.status(STATUS_CODES.UNAUTHORIZED).json({message : "You are not authorized , token incorrect failed"})
       
      }
           
    }
    else{
        handleRefreshToken(req,res,next,refreshToken);
    }
}

const handleRefreshToken = async(req,res,next,refreshToken) =>{
    if(refreshToken){
        try{
            const decodeRefresh = jwt.verify(refreshToken, globalThis.process.env.REFRESH_TOKEN_SECRET);
            const newAccessToken = jwt.sign({id : decodeRefresh?.id, role : decodeRefresh.role}, globalThis.process.env.ACCESS_TOKEN_SECRET, {expiresIn : "15m"});

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
        catch(error){
             res.status(STATUS_CODES.UNAUTHORIZED).json({message : "Refresh token is invalid"});
             console.log(error)
             return;
        }
    }
    else{
        return res.status(STATUS_CODES.UNAUTHORIZED).json({message :"You are not logged in"});
    }
    
}