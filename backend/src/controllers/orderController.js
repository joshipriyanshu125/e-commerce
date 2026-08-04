import asyncHandler from "../middleware/asyncHandler.js";

import {
    createOrderService,
    getMyOrdersService,
    getSingleOrderService,
    getAllOrdersService,
    updateOrderStatusService,
    cancelOrderService,
    adminCancelOrderService,
    refundOrderService,
    approveReturnService,
    rejectReturnService,
} from "../services/orderService.js";

/*
==============================
CREATE ORDER
==============================
*/
const createOrder = asyncHandler(async (req, res) => {
    const order = await createOrderService({ body: req.body, user: req.user });
    res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
    });
});

/*
==============================
GET MY ORDERS
==============================
*/
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await getMyOrdersService(req.user._id);
    res.status(200).json({ success: true, orders });
});

/*
==============================
GET SINGLE ORDER
==============================
*/
const getSingleOrder = asyncHandler(async (req, res) => {
    const order = await getSingleOrderService(req.params.id, req.user);
    res.status(200).json({ success: true, order });
});

/*
==============================
GET ALL ORDERS (ADMIN)
==============================
*/
const getAllOrders = asyncHandler(async (req, res) => {
    const result = await getAllOrdersService({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
    });

    res.status(200).json({
        success: true,
        orders: result.orders,
        total: result.total,
        page: result.page,
        pages: result.pages,
        totalAmount: result.totalAmount,
    });
});

/*
==============================
UPDATE ORDER STATUS (ADMIN)
==============================
*/
const updateOrderStatus = asyncHandler(async (req, res) => {
    const {
        status,
        courierName,
        trackingNumber,
        estimatedDelivery,
        note,
        cancellationReason,
    } = req.body;

    const order = await updateOrderStatusService(
        req.params.id,
        status,
        { courierName, trackingNumber, estimatedDelivery, note, cancellationReason },
        req.user
    );

    res.status(200).json({ success: true, order });
});

/*
==============================
CANCEL ORDER (USER)
==============================
*/
const cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await cancelOrderService(req.params.id, req.user, reason);
    res.status(200).json({ success: true, order });
});

/*
==============================
ADMIN CANCEL ORDER
==============================
*/
const adminCancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await adminCancelOrderService(req.params.id, reason, req.user);
    res.status(200).json({ success: true, order });
});

/*
==============================
REFUND ORDER (ADMIN)
==============================
*/
const refundOrder = asyncHandler(async (req, res) => {
    const order = await refundOrderService(req.params.id);
    res.status(200).json({ success: true, order });
});

/*
==============================
APPROVE RETURN (ADMIN)
==============================
*/
const approveReturn = asyncHandler(async (req, res) => {
    const order = await approveReturnService(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Return approved", order });
});

/*
==============================
REJECT RETURN (ADMIN)
==============================
*/
const rejectReturn = asyncHandler(async (req, res) => {
    const { adminNotes } = req.body;
    const order = await rejectReturnService(req.params.id, adminNotes, req.user);
    res.status(200).json({ success: true, message: "Return rejected", order });
});

export {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    adminCancelOrder,
    refundOrder,
    approveReturn,
    rejectReturn,
};