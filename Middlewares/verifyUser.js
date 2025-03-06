export const verifyUser = async(req, res, next) =>{
    if(req.userRole !== "user"){
        return res.status(403).json({message : "Access denied !"});
    }
    next();
}