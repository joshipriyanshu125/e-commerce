import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Address = mongoose.model(
    "Address",
    addressSchema
);

export default Address;