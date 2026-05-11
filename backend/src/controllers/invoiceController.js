import Order from "../models/Order.js";

// GENERATE INVOICE (Placeholder)
export const getInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Logic for invoice generation would go here
        res.status(200).json({
            success: true,
            message: "Invoice feature coming soon",
            order
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
