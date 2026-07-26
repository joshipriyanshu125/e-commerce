import Address from "../models/addressModel.js";

/*
===================================
SAVE / CREATE ADDRESS
===================================
*/
export const saveAddress = async (req, res) => {
    try {
        const address = await Address.create({
            user: req.user._id,
            ...req.body
        });

        res.status(201).json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
===================================
GET ALL ADDRESSES FOR CURRENT USER
===================================
*/
export const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json({ addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
===================================
SET ADDRESS AS DEFAULT
===================================
*/
export const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Unset all other defaults for this user
        await Address.updateMany({ user: req.user._id }, { isDefault: false });

        // Set the selected one as default
        const address = await Address.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { isDefault: true },
            { new: true }
        );

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({ address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
===================================
DELETE ADDRESS
===================================
*/
export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({ message: "Address deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};