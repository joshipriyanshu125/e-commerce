import asyncHandler from "../middleware/asyncHandler.js";
import PushSubscription from "../models/pushSubscriptionModel.js";

const subscribePush = asyncHandler(async (req, res) => {
  const subscription = req.body;

  // Upsert subscription for user
  const existing = await PushSubscription.findOne({ user: req.user._id });

  if (existing) {
    existing.subscription = subscription;
    await existing.save();
    return res.status(200).json({ success: true, subscription: existing });
  }

  const created = await PushSubscription.create({ user: req.user._id, subscription });

  res.status(201).json({ success: true, subscription: created });
});

const unsubscribePush = asyncHandler(async (req, res) => {
  await PushSubscription.deleteOne({ user: req.user._id });
  res.status(200).json({ success: true });
});

export { subscribePush, unsubscribePush };
