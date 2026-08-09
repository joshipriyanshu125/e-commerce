import "../config/env.js";
import {
    recalculateProductRating,
    getReviewStats,
    sortReviews,
    filterReviews,
    sanitizeReview,
} from "../services/reviewService.js";

function runMockTests() {
    console.log("🚀 Starting Offline Review Service Unit Tests...");

    // Test 1: getReviewStats
    console.log("\nTesting getReviewStats...");
    const mockReviews = [
        { rating: 5, status: "Approved" },
        { rating: 4, status: "Approved" },
        { rating: 5, status: "Approved" },
        { rating: 2, status: "Approved" },
        { rating: 1, status: "Pending" }, // should be ignored
        { rating: 3, status: "Hidden" },  // should be ignored
    ];
    const stats = getReviewStats(mockReviews);
    console.log("Stats output:", stats);
    if (stats.total !== 4) throw new Error(`Expected total 4, got ${stats.total}`);
    if (stats.average !== 4.0) throw new Error(`Expected average 4.0, got ${stats.average}`);
    if (stats.distribution[5] !== 2) throw new Error(`Expected 5 star count 2, got ${stats.distribution[5]}`);
    if (stats.distribution[2] !== 1) throw new Error(`Expected 2 star count 1, got ${stats.distribution[2]}`);
    console.log("✅ getReviewStats passed!");

    // Test 2: recalculateProductRating
    console.log("\nTesting recalculateProductRating...");
    const mockProduct = {
        reviews: [
            { rating: 5, status: "Approved" },
            { rating: 4, status: "Approved" },
            { rating: 1, status: "Pending" },
        ],
        rating: 0,
        numReviews: 0,
    };
    recalculateProductRating(mockProduct);
    console.log("Product rating after recalculation:", mockProduct.rating, "numReviews:", mockProduct.numReviews);
    if (mockProduct.numReviews !== 2) throw new Error(`Expected 2 reviews, got ${mockProduct.numReviews}`);
    if (mockProduct.rating !== 4.5) throw new Error(`Expected rating 4.5, got ${mockProduct.rating}`);
    console.log("✅ recalculateProductRating passed!");

    // Test 3: sortReviews
    console.log("\nTesting sortReviews...");
    const reviewList = [
        { helpfulVotes: [1, 2], createdAt: new Date("2026-08-01") },
        { helpfulVotes: [1, 2, 3, 4], createdAt: new Date("2026-08-05") },
        { helpfulVotes: [], createdAt: new Date("2026-08-03") },
    ];
    const sortedByHelpful = sortReviews(reviewList, "helpful");
    if (sortedByHelpful[0].helpfulVotes.length !== 4) throw new Error("Sort by helpful failed");
    const sortedByRecent = sortReviews(reviewList, "recent");
    if (sortedByRecent[0].createdAt.getTime() !== new Date("2026-08-05").getTime()) throw new Error("Sort by recent failed");
    console.log("✅ sortReviews passed!");

    // Test 4: filterReviews
    console.log("\nTesting filterReviews...");
    const listToFilter = [
        { rating: 5, isVerifiedPurchase: true },
        { rating: 4, isVerifiedPurchase: false },
        { rating: 5, isVerifiedPurchase: false },
    ];
    const filteredVerified = filterReviews(listToFilter, "verified");
    if (filteredVerified.length !== 1) throw new Error("Filter verified failed");
    const filteredFive = filterReviews(listToFilter, "5");
    if (filteredFive.length !== 2) throw new Error("Filter 5 star failed");
    console.log("✅ filterReviews passed!");

    console.log("\n🎉 All Offline Review Unit Tests Passed Successfully!");
}

try {
    runMockTests();
} catch (error) {
    console.error("❌ Test Failed:", error.message);
    process.exit(1);
}
