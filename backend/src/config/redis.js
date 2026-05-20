import Redis from "ioredis";

let redis = null;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    redis.on("connect", () => {
        console.log("✅ Redis Connected");
    });

    redis.on("error", (err) => {
        console.log("❌ Redis Error:", err);
    });
} else {
    console.log("⚠️ Redis URL not found. Skipping Redis connection.");
}



export default redis;