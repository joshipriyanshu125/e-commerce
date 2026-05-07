import User from "../models/userModel.js";

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            });
        } else {
            res.status(404).json({
                message: "User not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


export const adminRoute = async (req, res) => {
    res.json({
        message: "Welcome Admin"
    });
};