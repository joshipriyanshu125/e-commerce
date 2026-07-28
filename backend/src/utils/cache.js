import redis from "../config/redis.js";

export const setCache = async (key, data, expiry = 3600) => {
    try {
        await redis.set(key, JSON.stringify(data), "EX", expiry);
    } catch (error) {
        console.log("Cache Set Error:", error);
    }
};

export const getCache = async (key) => {
    try {
        const data = await redis.get(key);

        if (!data) return null;

        return JSON.parse(data);
    } catch (error) {
        console.log("Cache Get Error:", error);
        return null;
    }
};

export const deleteCache = async (key) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.log("Cache Delete Error:", error);
    }
};

export const clearCachePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.log("Cache Delete Pattern Error:", error);
    }
};