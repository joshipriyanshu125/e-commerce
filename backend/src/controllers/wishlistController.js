import mongoose from "mongoose";
import Wishlist from "../models/wishlistModel.js";
import Product from "../models/Product.js";

const load = (user) => Wishlist.findOne({ user }).populate({ path: "items.product", select: "name price discountPrice countInStock status category images colors sizes" });
const shape = (wishlist) => ({ items: (wishlist?.items || []).filter(i => i.product).map(i => {
    const product = i.product.toObject ? i.product.toObject() : i.product;
    const currentPrice = product.discountPrice ?? product.price;
    return { id: i._id, product, priceAtAdd: i.priceAtAdd, notifyOnRestock: i.notifyOnRestock, addedAt: i.createdAt, inStock: product.countInStock > 0 && product.status !== "OutOfStock", priceChanged: Number(currentPrice) !== Number(i.priceAtAdd), priceChange: Number(currentPrice) - Number(i.priceAtAdd) };
}) });

export const getWishlist = async (req, res) => res.json({ success: true, wishlist: shape(await load(req.user._id)) });
export const addToWishlist = async (req, res) => {
    const { productId, notifyOnRestock = true } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid product" });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id });
    const existing = wishlist.items.find(i => i.product.toString() === productId);
    if (existing) existing.notifyOnRestock = notifyOnRestock;
    else wishlist.items.push({ product: productId, priceAtAdd: product.discountPrice ?? product.price, notifyOnRestock });
    await wishlist.save();
    res.json({ success: true, message: existing ? "Wishlist preference updated" : "Added to wishlist", wishlist: shape(await load(req.user._id)) });
};
export const removeFromWishlist = async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) { wishlist.items = wishlist.items.filter(i => i.product.toString() !== req.params.productId); await wishlist.save(); }
    res.json({ success: true, message: "Removed from wishlist", wishlist: shape(await load(req.user._id)) });
};
export const removeManyFromWishlist = async (req, res) => {
    if (!Array.isArray(req.body.productIds)) return res.status(400).json({ success: false, message: "productIds must be an array" });
    await Wishlist.updateOne({ user: req.user._id }, { $pull: { items: { product: { $in: req.body.productIds } } } });
    res.json({ success: true, wishlist: shape(await load(req.user._id)) });
};
export const updateWishlistItem = async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id, "items.product": req.params.productId });
    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist item not found" });
    wishlist.items.find(i => i.product.toString() === req.params.productId).notifyOnRestock = Boolean(req.body.notifyOnRestock);
    await wishlist.save(); res.json({ success: true, wishlist: shape(await load(req.user._id)) });
};
