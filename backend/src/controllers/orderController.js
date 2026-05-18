import asyncHandler from "../middleware/asyncHandler.js";

import {
    createOrderService,
    getMyOrdersService,
    getSingleOrderService,
    getAllOrdersService,
    updateOrderStatusService,
} from "../services/orderService.js";

/*
==============================
CREATE ORDER
==============================
*/
const createOrder = asyncHandler(
    async (req, res) => {

        const order =
            await createOrderService({
                body: req.body,
                user: req.user,
            });

        res.status(201).json({

            success: true,

            message:
                "Order placed successfully",

            order,
        });
    }
);

/*
==============================
GET MY ORDERS
==============================
*/
const getMyOrders =
    asyncHandler(async (req, res) => {

        const orders =
            await getMyOrdersService(
                req.user._id
            );

        res.status(200).json({

            success: true,

            orders,
        });
    });

/*
==============================
GET SINGLE ORDER
==============================
*/
const getSingleOrder =
    asyncHandler(async (req, res) => {

        const order =
            await getSingleOrderService(
                req.params.id
            );

        res.status(200).json({

            success: true,

            order,
        });
    });

/*
==============================
GET ALL ORDERS
==============================
*/
const getAllOrders =
    asyncHandler(async (req, res) => {

        const result =
            await getAllOrdersService();

        res.status(200).json({

            success: true,

            totalAmount:
                result.totalAmount,

            orders:
                result.orders,
        });
    });

/*
==============================
UPDATE ORDER STATUS
==============================
*/
const updateOrderStatus =
    asyncHandler(async (req, res) => {

        const order =
            await updateOrderStatusService(
                req.params.id,
                req.body.status
            );

        res.status(200).json({

            success: true,

            order,
        });
    });

export {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
};