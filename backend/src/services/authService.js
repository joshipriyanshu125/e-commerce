import bcrypt from "bcryptjs";

import generateToken from "../utils/generateToken.js";

import {
    findUserByEmail,
    createUser,
} from "../repositories/userRepository.js";

/*
==============================
REGISTER USER SERVICE
==============================
*/
const registerUserService = async ({
    name,
    email,
    password,
}) => {

    // CHECK IF USER EXISTS
    const userExists =
        await findUserByEmail(email);

    if (userExists) {

        throw new Error(
            "User already exists"
        );
    }

    // HASH PASSWORD
    const salt =
        await bcrypt.genSalt(10);

    const hashedPassword =
        await bcrypt.hash(
            password,
            salt
        );

    // CREATE USER
    const user = await createUser({
        name,
        email,
        password: hashedPassword,
    });

    // RETURN USER DATA
    return {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        token: generateToken(
            user._id
        ),
    };
};

/*
==============================
LOGIN USER SERVICE
==============================
*/
const loginUserService = async ({
    email,
    password,
}) => {

    // FIND USER
    const user =
        await findUserByEmail(email);

    // CHECK USER
    if (!user) {

        throw new Error(
            "Invalid email or password"
        );
    }

    // CHECK PASSWORD
    const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isMatch) {

        throw new Error(
            "Invalid email or password"
        );
    }

    // RETURN USER DATA
    return {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        token: generateToken(
            user._id
        ),
    };
};

export {
    registerUserService,
    loginUserService,
};