import jwt from "jsonwebtoken";

import {
    findUserByEmail,
    createUser,
} from "../../repositories/userRepository.js";

/*
==================================================
GENERATE JWT
==================================================
*/
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

/*
==================================================
REGISTER USER
==================================================
*/
const registerUserService = async ({
    name,
    email,
    password,
}) => {

    const existingUser =
        await findUserByEmail(email);

    if (existingUser) {
        throw new Error("User already exists");
    }

    const user =
        await createUser({
            name,
            email,
            password,
        });

    return {
        success: true,
        token: generateToken(user._id),
        user,
    };
};

/*
==================================================
LOGIN USER
==================================================
*/
const loginUserService = async ({
    email,
    password,
}) => {

    const user =
        await findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch =
        await user.matchPassword(password);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    return {
        success: true,
        token: generateToken(user._id),
        user,
    };
};

export {
    registerUserService,
    loginUserService,
};