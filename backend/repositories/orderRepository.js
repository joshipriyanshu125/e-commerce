import Order from "../src/models/Order.js";
import Cart from "../src/models/cartModel.js";
import Product from "../src/models/Product.js";

/*
==================================================
GET USER CART
==================================================
*/
const getUserCartRepository = async (userId) => {
    return await Cart.findOne({ user: userId });
};

/*
==================================================
GET PRODUCT BY ID
==================================================
*/
const getProductByIdRepository = async (productId) => {
    return await Product.findById(productId);
};

/*
==================================================
CREATE ORDER
==================================================
*/
const createOrderRepository = async (orderData) => {
    return await Order.create(orderData);
};

/*
==================================================
GET ORDER BY ID (populated)
==================================================
*/
const getOrderByIdRepository = async (orderId) => {
    return await Order.findById(orderId)
        .populate("user", "name email")
        .populate("returnInfo.requestId");
};

/*
==================================================
GET USER ORDERS
==================================================
*/
const getUserOrdersRepository = async (userId) => {
    return await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
};

/*
==================================================
GET ALL ORDERS (admin — paginated, filtered, sorted)
==================================================
*/
const getAllOrdersRepository = async ({
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
} = {}) => {
    const query = {};

    // Status filter
    if (status && status !== "All") {
        query.orderStatus = status;
    }

    // Search by order ID or customer name
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        // We have to handle the populated user field differently via aggregation or sub-query
        // For simplicity, we'll handle search post-query for names or match on _id prefix
        // We'll do a DB-level search on shippingInfo.fullName and _id string
    }

    const sortDir = sortOrder === "asc" ? 1 : -1;
    const sortObj = { [sortBy]: sortDir };

    let queryBuilder = Order.find(query)
        .populate("user", "name email")
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit);

    let orders = await queryBuilder.lean();

    // Post-filter for search (handles name and ID substring)
    if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        orders = orders.filter((o) => {
            const idMatch = o._id.toString().toLowerCase().includes(s);
            const nameMatch = (o.shippingInfo?.fullName || "").toLowerCase().includes(s);
            const userNameMatch = (o.user?.name || "").toLowerCase().includes(s);
            const emailMatch = (o.user?.email || "").toLowerCase().includes(s);
            return idMatch || nameMatch || userNameMatch || emailMatch;
        });
    }

    // Total count (without pagination, for search it's approximate)
    const total = await Order.countDocuments(query);

    return { orders, total, page, limit };
};

/*
==================================================
UPDATE ORDER
==================================================
*/
const updateOrderRepository = async (order) => {
    return await order.save();
};

export {
    getUserCartRepository,
    getProductByIdRepository,
    createOrderRepository,
    getOrderByIdRepository,
    getUserOrdersRepository,
    getAllOrdersRepository,
    updateOrderRepository,
};