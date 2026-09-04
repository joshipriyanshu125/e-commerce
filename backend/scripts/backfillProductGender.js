import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";

dotenv.config();

const WOMEN_AUDIENCE_PATTERN = /\b(?:women'?s?|ladies|female|girls?)\b/i;
const MEN_AUDIENCE_PATTERN = /\b(?:men'?s?|male|boys?)\b/i;
const applyChanges = process.argv.includes("--apply");

const inferredGender = (product) => {
    const text = [product.name, product.description, product.category, ...(product.tags || [])]
        .filter(Boolean)
        .join(" ");

    const isWomen = WOMEN_AUDIENCE_PATTERN.test(text);
    const isMen = MEN_AUDIENCE_PATTERN.test(text);

    if (isWomen && !isMen) return "women";
    if (isMen && !isWomen) return "men";
    return null;
};

try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({}).select("name description category tags gender").lean();
    const updates = products.flatMap((product) => {
        const gender = inferredGender(product);
        return gender && gender !== product.gender
            ? [{ updateOne: { filter: { _id: product._id }, update: { $set: { gender } } } }]
            : [];
    });

    console.log(`${updates.length} product gender assignment(s) ${applyChanges ? "will be updated" : "need updating"}.`);
    if (!applyChanges) {
        console.log("Dry run only. Run `node scripts/backfillProductGender.js --apply` to save the corrections.");
    } else if (updates.length) {
        await Product.bulkWrite(updates);
        console.log("Gender assignments updated.");
    }
} finally {
    await mongoose.disconnect();
}
