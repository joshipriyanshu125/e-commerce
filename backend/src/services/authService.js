import bcrypt from "bcryptjs";

import {
    findUserByEmail,
    createUser,
} from "../repositories/userRepository.js";

const registerUserService = async ({
    name,
    email,
    password,
}) => {

    const existingUser =
        await findUserByEmail(email);

    if (existingUser) {

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

    return user;
};

export {
    registerUserService,
};