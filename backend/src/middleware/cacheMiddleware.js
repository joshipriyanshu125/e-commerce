import { getCache, setCache } from "../utils/cache.js";

const cacheMiddleware = (keyGenerator, expiry = 3600) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);

            const cachedData = await getCache(key);

            if (cachedData) {
                return res.status(200).json({
                    success: true,
                    cached: true,
                    data: cachedData,
                });
            }

            const originalJson = res.json;

            res.json = function (body) {
                if (body.success) {
                    setCache(key, body, expiry);
                }

                return originalJson.call(this, body);
            };

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default cacheMiddleware;