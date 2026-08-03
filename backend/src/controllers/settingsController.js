import Settings from "../models/settingsModel.js";
import asyncHandler from "../middleware/asyncHandler.js";

/*
========================================
GET STORE SETTINGS
========================================
*/
export const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    // Create default settings if it doesn't exist in DB
    if (!settings) {
        settings = await Settings.create({});
    }

    res.status(200).json({
        success: true,
        settings,
    });
});

/*
========================================
UPDATE STORE SETTINGS (ADMIN ONLY)
========================================
*/
export const updateSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();

    if (!settings) {
        settings = new Settings(req.body);
    } else {
        if (req.body.storeInfo) Object.assign(settings.storeInfo, req.body.storeInfo);
        if (req.body.payment) Object.assign(settings.payment, req.body.payment);
        if (req.body.shipping) Object.assign(settings.shipping, req.body.shipping);
        if (req.body.tax) Object.assign(settings.tax, req.body.tax);
        if (req.body.email) Object.assign(settings.email, req.body.email);
        if (req.body.security) Object.assign(settings.security, req.body.security);
    }

    await settings.save();

    res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        settings,
    });
});
