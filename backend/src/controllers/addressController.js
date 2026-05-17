import Address from "../models/addressModel.js";

export const saveAddress = async (req, res) => {
    try {

        const address = await Address.create({
            user: req.user._id,
            ...req.body
        });



        res.status(201).json(address);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};