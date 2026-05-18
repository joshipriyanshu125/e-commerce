import logger from "../utils/logger.js";

const requestLogger = (
    req,
    res,
    next
) => {

    console.log("LOGGER MIDDLEWARE RUNNING");

    logger.info({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });

    next();
};

export default requestLogger;