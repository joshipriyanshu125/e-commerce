import User from "../src/models/userModel.js";

/*
==================================================
FIND USER BY EMAIL
==================================================
*/
const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

/*
==================================================
FIND USER BY ID
==================================================
*/
const findUserById = async (id) => {
    return await User.findById(id);
};

/*
==================================================
CREATE USER
==================================================
*/
const createUser = async (userData) => {
    return await User.create(userData);
};

/*
==================================================
UPDATE USER
==================================================
*/
const updateUserById = async (id, updateData) => {
    return await User.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
};

/*
==================================================
DELETE USER
==================================================
*/
const deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id);
};

/*
==================================================
GET ALL USERS
==================================================
*/
const getAllUsers = async () => {
    return await User.find().select("-password");
};

export {
    findUserByEmail,
    findUserById,
    createUser,
    updateUserById,
    deleteUserById,
    getAllUsers,
};