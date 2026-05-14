import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";


export const addToCart = async (req, res) => {
    try {

        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        let cart = await Cart.findOne({
            user: req.user._id
        });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item =>
                item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity
            });
        }

        let total = 0;

        for (const item of cart.items) {
            const prod = await Product.findById(item.product);

            total += prod.price * item.quantity;
        }

        cart.totalPrice = total;

        await cart.save();

        res.status(200).json(cart);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET USER CART
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

        if (!cart) {
            return res.status(200).json({ items: [], totalPrice: 0 });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== req.params.productId
        );

        let total = 0;
        for (const item of cart.items) {
            const prod = await Product.findById(item.product);
            if (prod) {
                total += prod.price * item.quantity;
            }
        }
        cart.totalPrice = total;

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CLEAR CART
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        }

        res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};