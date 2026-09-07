import asyncHandler from "../middleware/asyncHandler.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";

const getVapidPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: "Push notifications are not configured on this server.",
    });
  }

  res.status(200).json({ success: true, publicKey });
};

const subscribePush = asyncHandler(async (req, res) => {
    const subscription = req.body;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ success: false, message: "A valid push subscription is required." });
  }

  // Upsert subscription for user
  const existing = await PushSubscription.findOne({ user: req.user._id });

  let savedSubscription;
  if (existing) {
    existing.subscription = subscription;
    await existing.save();
    savedSubscription = existing;
  } else {
    savedSubscription = await PushSubscription.create({ user: req.user._id, subscription });
  }

  // Registering a browser subscription is an explicit opt-in to push delivery.
  const preferences = await NotificationPreference.getOrCreate(req.user._id);
  preferences.push.enabled = true;
  preferences.push.orderUpdates = true;
  preferences.push.deliveryUpdates = true;
  await preferences.save();

  res.status(existing ? 200 : 201).json({ success: true, subscription: savedSubscription });
});

const unsubscribePush = asyncHandler(async (req, res) => {
  await PushSubscription.deleteOne({ user: req.user._id });
  const preferences = await NotificationPreference.getOrCreate(req.user._id);
  preferences.push.enabled = false;
  await preferences.save();
  res.status(200).json({ success: true });
});

export { getVapidPublicKey, subscribePush, unsubscribePush };
