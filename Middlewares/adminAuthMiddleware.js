import jwt from 'jsonwebtoken';

export const verifyAdmin = async (req, res, next) => {
    const accessToken = req?.cookies?.adminAccessToken;
    const refreshToken = req?.cookies?.adminRefreshToken;
   

    if (accessToken && refreshToken) {
        try {
            const decode = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

            const userId = decode.id;
            const userRole = decode.role;

            req.userId = userId;
            req.userRole = userRole;

            return next();

        }
        catch (error) {
            return res.status(401).json({ message: "You are not authorized, token incorrect failed" })
        }
    }
    else if (!accessToken && refreshToken) {
        handleRefreshToken(req, res, next, refreshToken);
    } else {
        res.status(401).json({ success: false, message: "You are not authorized" })
    }
}

const handleRefreshToken = async (req, res, next, refreshToken) => {
    if (refreshToken) {
        try {
            const decodeRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const newAccessToken = jwt.sign({ id: decodeRefresh?.id, role: decodeRefresh.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

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
            res.status(401).json({ message: "Refresh Token is invalid" })
        }
    }
    else {
        return res.status(401).json({ message: "You are not authorized" })
    }
}