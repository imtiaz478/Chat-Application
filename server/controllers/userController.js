import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"

export const signUp = async (req, res) => {
    const { fullName , email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success: false, message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);


        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Account created successflly"})
        
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
        
    }
    
}


// controller to log in a user


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({email})

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if(!isPasswordCorrect){
            return res.json({success: false , message: "Invalid credentials"})

        }

        const token = generateToken(userData._id)

        res.json({success: true, userData, token, message: "Login successful"})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
        
        
    }
}


// Controller to check if user is authenticated

export const checkAuth = (req, res) => {
    res.json({success : true, user: req.user});
}


// Controller to upadate user profile details

export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;

        let updatedUser;

        console.log(
            "PROFILE PIC RECEIVED:",
            profilePic ? "YES" : "NO"
        );

        if (!profilePic) {

            updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    bio,
                    fullName
                },
                { new: true }
            );

        } else {

            try {
                console.log("UPLOADING IMAGE TO CLOUDINARY...");

                console.log("ProfilePic Preview:", profilePic.substring(0, 30));

                const upload = await cloudinary.uploader.upload(
                    profilePic,
                    {   
                        
                        resource_type: "image"
                    }
                );

                console.log("UPLOAD SUCCESS:", upload.secure_url);

                updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        profilePic: upload.secure_url,
                        bio,
                        fullName
                    },
                    { new: true }
                );

            } catch (cloudinaryError) {

                console.log(
                    "CLOUDINARY ERROR DETAILS:",
                    cloudinaryError
                );

                throw cloudinaryError;
            }
        }

        console.log("UPDATED USER:", updatedUser);

        res.json({
            success: true,
            user: updatedUser
        });

    } catch (error) {

        console.log("========== PROFILE UPDATE ERROR ==========");
        console.log("MESSAGE:", error.message);
        console.log("NAME:", error.name);
        console.log("FULL ERROR:", error);
        console.log("==========================================");

        res.json({
            success: false,
            message: error.message
        });
    }
};