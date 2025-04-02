import jwt from 'jsonwebtoken';
import { STATUS_CODES } from '../utils/constants.js';

export const verifyAdmin = async (req, res, next) => {
    const accessToken = req?.cookies?.adminAccessToken;
    const refreshToken = req?.cookies?.adminRefreshToken;
   

    if (accessToken && refreshToken) {
        try {
            const decode = jwt.verify(accessToken, globalThis.process.env.ACCESS_TOKEN_SECRET);

            const userId = decode.id;
            const userRole = decode.role;

            req.userId = userId;
            req.userRole = userRole;

            return next();

        }
        catch (error) {
            console.log(error)
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "You are not authorized, token incorrect failed" })
        }
    }
    else if (!accessToken && refreshToken) {
        handleRefreshToken(req, res, next, refreshToken);
    } else {
        res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "You are not authorized" })
    }
}

const handleRefreshToken = async (req, res, next, refreshToken) => {
    if (refreshToken) {
        try {
            const decodeRefresh = jwt.verify(refreshToken, globalThis.process.env.REFRESH_TOKEN_SECRET);
            const newAccessToken = jwt.sign({ id: decodeRefresh?.id, role: decodeRefresh.role }, globalThis.process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

            res.cookie("adminAccessToken", newAccessToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 1 * 60 * 1000,
            });

            req.userId = decodeRefresh.id;
            req.userRole = decodeRefresh.role;
            next();
        }
        catch (error) {
            console.log(error)
            res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Refresh Token is invalid" })
        }
    }
    else {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "You are not authorized" })
    }
}