import User from "../src/models/userModel.js";

const findUserByEmail = async (email) => {

    return await User.findOne({ email });
};

const findUserById = async (id) => {

    return await User.findById(id);
};

const createUser = async (userData) => {

    return await User.create(userData);
};

const updateUserById = async (
    id,
    updateData
) => {

    return await User.findByIdAndUpdate(
        id,
        updateData,
        {
            new: true,
        }
    );
};

export {
    findUserByEmail,
    findUserById,
    createUser,
    updateUserById,
};