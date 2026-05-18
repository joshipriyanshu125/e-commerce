import logger from "../utils/logger.js";

const notFound = (req, res, next) => {

    const error = new Error(
        `Not Found - ${req.originalUrl}`
    );

    res.status(404);

    next(error);
};

const errorHandler = (
    err,
    req,
    res,
    next
) => {

    let statusCode =
        res.statusCode === 200
            ? 500
            : res.statusCode;

    let message = err.message;

    /*
    MONGOOSE INVALID OBJECT ID
    */
    if (
        err.name === "CastError" &&
        err.kind === "ObjectId"
    ) {

        statusCode = 404;

        message = "Resource Not Found";
    }

    /*
    MONGOOSE DUPLICATE KEY ERROR
    */
    if (err.code === 11000) {

        statusCode = 400;

        const field =
            Object.keys(err.keyValue)[0];

        message = `${field} already exists`;
    }

    /*
    MONGOOSE VALIDATION ERROR
    */
    if (err.name === "ValidationError") {

        statusCode = 400;

        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    /*
    LOG ERROR
    */
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });

    /*
    RESPONSE
    */
    res.status(statusCode).json({

        success: false,

        message,

        stack:
            process.env.NODE_ENV === "production"
                ? null
                : err.stack,
    });
};

export {
    notFound,
    errorHandler
};