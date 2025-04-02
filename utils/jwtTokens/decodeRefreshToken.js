import jwt from 'jsonwebtoken';

export const refreshTokenDecoder =(req)=>{
if(!req?.cookies?.userRefreshToken) return null
const token =req.cookies.userRefreshToken;
const decode=jwt.verify(token,globalThis.process.env.REFRESH_TOKEN_SECRET);
const id=decode.id
return id 
}
