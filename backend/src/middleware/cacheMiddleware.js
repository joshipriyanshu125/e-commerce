import { getCache, setCache } from "../utils/cache.js";

const cacheMiddleware = (
    keyGenerator,
    expiry = 3600
) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);

            const cachedData = await getCache(key);

            // CACHE HIT — return the full original response body
            if (cachedData) {
                return res.status(200).json(cachedData);
            }

            // STORE ORIGINAL RESPONSE METHOD
            const originalJson = res.json.bind(res);

            // OVERRIDE res.json to capture and cache the response
            res.json = async (body) => {
                try {
                    // CACHE ONLY SUCCESS RESPONSES
                    if (body?.success) {
                        await setCache(key, body, expiry);
                    }
                } catch (cacheError) {
                    console.error(
                        "Cache Set Error:",
                        cacheError.message
                    );
                }

                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error(
                "Cache Middleware Error:",
                error.message
            );

            next();
        }
    };
};

export default cacheMiddleware;