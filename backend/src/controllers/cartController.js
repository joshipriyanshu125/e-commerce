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