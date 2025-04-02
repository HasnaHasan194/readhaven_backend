import crypto from "crypto";
const generateReferralCode =(firstName,lastName)=>{
    const randomString =crypto.randomBytes(3).toString("hex").toUpperCase(); 
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    return `${initials}${randomString}`;
}
export default generateReferralCode;
