/*
==================================================
COMPREHENSIVE EMAIL TEMPLATES
==================================================
Gen-Z Fashion E-commerce Notification System
All 40+ responsive HTML email templates
==================================================
*/

// Brand configuration
const BRAND = {
    name: "ATELIER",
    tagline: "Premium Fashion",
    logo: "🛍️",
    primaryColor: "#f59e0b",
    secondaryColor: "#1a1a2e",
    backgroundColor: "#0f0f1a",
    cardBackground: "#1c1c28",
    textColor: "#ffffff",
    mutedText: "#a0a0b0",
    borderColor: "#2a2a3a",
    supportEmail: "joshipiyush0105@gmail.com",
    supportPhone: "+91 (910) 513 1502",
    website: "https://atelier.com",
    socialLinks: {
        instagram: "https://instagram.com/atelier",
        twitter: "https://twitter.com/atelier",
        facebook: "https://facebook.com/atelier",
        pinterest: "https://pinterest.com/atelier",
    },
};

/*
==================================================
BASE WRAPPER
==================================================
*/
const baseWrapper = (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>${BRAND.name}</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; }
        td, th { border-collapse: collapse; }
        .fallback-font { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style type="text/css">
        /* Reset */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
            .mobile-center { text-align: center !important; }
            .mobile-hide { display: none !important; }
            .mobile-button { width: 100% !important; display: block !important; }
            .mobile-image { width: 100% !important; height: auto !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 18px !important; }
        }
        @media only screen and (max-width: 420px) {
            .container { width: 100% !important; }
            .mobile-padding { padding-left: 15px !important; padding-right: 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundColor}; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;">
    ${preheader ? `<!--[if !mso]><!-- --><div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div><!--<![endif]-->` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.backgroundColor};">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
                    <!-- Header / Logo -->
                    <tr>
                        <td align="center" style="padding: 20px 20px 10px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="font-size: 36px; line-height: 1;">
                                        ${BRAND.logo}
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 8px;">
                                        <span style="font-size: 22px; font-weight: 800; letter-spacing: 4px; color: ${BRAND.textColor}; text-transform: uppercase;">${BRAND.name}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 2px;">
                                        <span style="font-size: 10px; letter-spacing: 3px; color: ${BRAND.mutedText}; text-transform: uppercase;">${BRAND.tagline}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-bottom: 1px solid ${BRAND.borderColor};"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-padding" style="padding: 30px 40px; background-color: ${BRAND.cardBackground}; border-radius: 16px; margin: 0 20px; display: block;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 20px 20px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-bottom: 1px solid ${BRAND.borderColor}; padding-bottom: 20px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="padding-bottom: 15px;">
                                                    <a href="${BRAND.socialLinks.instagram}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                                        <span style="font-size: 20px;">📸</span>
                                                    </a>
                                                    <a href="${BRAND.socialLinks.twitter}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                                        <span style="font-size: 20px;">🐦</span>
                                                    </a>
                                                    <a href="${BRAND.socialLinks.facebook}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                                        <span style="font-size: 20px;">👍</span>
                                                    </a>
                                                    <a href="${BRAND.socialLinks.pinterest}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                                        <span style="font-size: 20px;">📌</span>
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="font-size: 11px; color: ${BRAND.mutedText}; line-height: 1.6;">
                                                    <p style="margin: 0 0 5px;">
                                                        <strong style="color: ${BRAND.textColor};">${BRAND.name}</strong>
                                                    </p>
                                                    <p style="margin: 0 0 5px;">
                                                        <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.supportEmail}</a>
                                                        &nbsp;|&nbsp;
                                                        ${BRAND.supportPhone}
                                                    </p>
                                                    <p style="margin: 0 0 10px;">
                                                        <a href="${BRAND.website}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.website}</a>
                                                    </p>
                                                    <p style="margin: 0;">
                                                        You're receiving this email because you have an account with ${BRAND.name}.
                                                    </p>
                                                    <p style="margin: 5px 0 0;">
                                                        <a href="%unsubscribe_url%" style="color: ${BRAND.mutedText}; text-decoration: underline;">Unsubscribe</a>
                                                        &nbsp;|&nbsp;
                                                        <a href="${BRAND.website}/privacy" style="color: ${BRAND.mutedText}; text-decoration: underline;">Privacy Policy</a>
                                                    </p>
                                                    <p style="margin: 10px 0 0; font-size: 10px; color: #666;">
                                                        &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/*
==================================================
BUTTON HELPER
==================================================
*/
const button = (text, url, color = BRAND.primaryColor) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td align="center" style="padding: 20px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" style="border-radius: 12px; background-color: ${color};">
                        <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 14px; font-weight: 700; letter-spacing: 1px; color: #000000; text-decoration: none; text-transform: uppercase; border-radius: 12px; background-color: ${color};">
                            ${text}
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;

/*
==================================================
ORDER SUMMARY TABLE
==================================================
*/
const orderSummaryTable = (items, total, shipping, tax) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 15px;">
    <tr>
        <td style="padding: 15px; background-color: ${BRAND.backgroundColor}; border-radius: 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="padding-bottom: 10px; border-bottom: 1px solid ${BRAND.borderColor};">
                        <span style="font-size: 12px; font-weight: 700; color: ${BRAND.textColor}; text-transform: uppercase; letter-spacing: 1px;">Order Summary</span>
                    </td>
                </tr>
                ${items
        .map(
            (item) => `
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid ${BRAND.borderColor};">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td width="60" valign="top">
                                    <img src="${item.image}" alt="${item.name}" width="50" height="50" style="border-radius: 8px; width: 50px; height: 50px; object-fit: cover;" />
                                </td>
                                <td style="padding-left: 10px; font-size: 13px; color: ${BRAND.textColor};">
                                    <strong>${item.name}</strong>
                                    <br>
                                    <span style="font-size: 11px; color: ${BRAND.mutedText};">
                                        Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ""} ${item.color ? `| ${item.color}` : ""}
                                    </span>
                                </td>
                                <td align="right" valign="top" style="font-size: 13px; color: ${BRAND.textColor}; white-space: nowrap;">
                                    $${(item.price * item.quantity).toFixed(2)}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                `
        )
        .join("")}
                <tr>
                    <td style="padding-top: 10px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                            <tr>
                                <td style="color: ${BRAND.mutedText}; padding: 3px 0;">Subtotal</td>
                                <td align="right" style="color: ${BRAND.textColor};">$${total.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="color: ${BRAND.mutedText}; padding: 3px 0;">Shipping</td>
                                <td align="right" style="color: ${BRAND.textColor};">${shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</td>
                            </tr>
                            ${tax ? `<tr><td style="color: ${BRAND.mutedText}; padding: 3px 0;">Tax</td><td align="right" style="color: ${BRAND.textColor};">$${tax.toFixed(2)}</td></tr>` : ""}
                            <tr>
                                <td style="padding-top: 8px; border-top: 1px solid ${BRAND.borderColor}; font-weight: 700; color: ${BRAND.textColor}; font-size: 15px;">Total</td>
                                <td align="right" style="padding-top: 8px; border-top: 1px solid ${BRAND.borderColor}; font-weight: 700; color: ${BRAND.primaryColor}; font-size: 15px;">
                                    $${(total + shipping + (tax || 0)).toFixed(2)}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;

/*
==================================================
1. ACCOUNT EMAILS
==================================================
*/

// Welcome Email
export const welcomeTemplate = (name, verifyLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 28px; font-weight: 800; color: ${BRAND.textColor}; margin: 0; letter-spacing: -0.5px;">Welcome to ${BRAND.name}</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 15px;">
                <span style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.6;">
                    Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, we're thrilled to have you!
                </span>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8; padding-bottom: 5px;">
                <p style="margin: 0 0 10px;">Your account has been created successfully. Get ready to explore the latest trends and exclusive collections.</p>
                <p style="margin: 0 0 10px;">Please verify your email address to unlock all features:</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Verify Email Address", verifyLink)}
            </td>
        </tr>
        <tr>
            <td style="font-size: 13px; color: ${BRAND.mutedText}; line-height: 1.8; padding-top: 5px;">
                <p style="margin: 0;">Already have an account? <a href="${BRAND.website}/login" style="color: ${BRAND.primaryColor}; text-decoration: none; font-weight: 600;">Log in here</a></p>
            </td>
        </tr>
        <tr>
            <td style="padding-top: 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.backgroundColor}; border-radius: 12px; padding: 15px;">
                    <tr>
                        <td align="center" style="padding-bottom: 8px;">
                            <span style="font-size: 12px; font-weight: 700; color: ${BRAND.textColor}; text-transform: uppercase; letter-spacing: 1px;">Featured Collections</span>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="font-size: 13px; color: ${BRAND.mutedText}; line-height: 1.6;">
                            <a href="${BRAND.website}/shop/new-arrivals" style="color: ${BRAND.primaryColor}; text-decoration: none; margin: 0 8px;">New Arrivals</a>
                            &nbsp;·&nbsp;
                            <a href="${BRAND.website}/shop/best-sellers" style="color: ${BRAND.primaryColor}; text-decoration: none; margin: 0 8px;">Best Sellers</a>
                            &nbsp;·&nbsp;
                            <a href="${BRAND.website}/shop/sale" style="color: ${BRAND.primaryColor}; text-decoration: none; margin: 0 8px;">Sale</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
`, "Welcome to ATELIER! Verify your email to get started.");

// Email Verification
export const emailVerificationTemplate = (name, verifyLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📧</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Verify Your Email</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8; padding-bottom: 5px;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Please click the button below to verify your email address. This helps us keep your account secure.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Verify Email", verifyLink)}
            </td>
        </tr>
        <tr>
            <td style="font-size: 12px; color: ${BRAND.mutedText}; line-height: 1.6; padding-top: 10px;">
                <p style="margin: 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            </td>
        </tr>
    </table>
`, "Verify your email address");

// Email Verified Confirmation
export const emailVerifiedTemplate = (name) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Email Verified!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your email has been verified successfully. You now have full access to your account.</p>
                <p style="margin: 0;">Start shopping and enjoy the latest fashion trends!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Start Shopping", `${BRAND.website}/shop`)}
            </td>
        </tr>
    </table>
`, "Email verified successfully");

// Forgot Password
export const forgotPasswordTemplate = (name, resetLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🔒</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Reset Your Password</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We received a request to reset your password. Click the button below to create a new password.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Reset Password", resetLink)}
            </td>
        </tr>
        <tr>
            <td style="font-size: 12px; color: ${BRAND.mutedText}; line-height: 1.6; padding-top: 10px;">
                <p style="margin: 0;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            </td>
        </tr>
    </table>
`, "Reset your password");

// Password Changed
export const passwordChangedTemplate = (name) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🔐</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Password Changed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your password has been changed successfully.</p>
                <p style="margin: 0;">If you didn't make this change, please contact us immediately at <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.supportEmail}</a>.</p>
            </td>
        </tr>
    </table>
`, "Password changed successfully");

// Email Changed
export const emailChangedTemplate = (name, newEmail) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📧</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Email Address Updated</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your email address has been changed to <strong style="color: ${BRAND.textColor};">${newEmail}</strong>.</p>
                <p style="margin: 0;">If you didn't make this change, please contact us immediately.</p>
            </td>
        </tr>
    </table>
`, "Email address updated");

// Account Blocked
export const accountBlockedTemplate = (name, reason) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🚫</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">Account Temporarily Blocked</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your account has been temporarily blocked for the following reason:</p>
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; color: ${BRAND.textColor}; font-style: italic;">${reason}</p>
                <p style="margin: 0;">If you believe this is a mistake, please contact our support team at <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.supportEmail}</a>.</p>
            </td>
        </tr>
    </table>
`, "Account temporarily blocked");

// Account Unblocked
export const accountUnblockedTemplate = (name) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Account Reinstated</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Welcome back <strong style="color: ${BRAND.textColor};">${name}</strong>!</p>
                <p style="margin: 0 0 10px;">Your account has been reinstated. You can now access all features again.</p>
                <p style="margin: 0;">We're glad to have you back. Happy shopping!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Continue Shopping", `${BRAND.website}/shop`)}
            </td>
        </tr>
    </table>
`, "Account reinstated");

// Delete Account
export const accountDeletedTemplate = (name) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">👋</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Account Deleted</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Goodbye <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We're sorry to see you go. Your account has been deleted as requested.</p>
                <p style="margin: 0;">If you change your mind, we'd love to have you back. You can create a new account anytime.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-top: 15px; font-size: 24px; line-height: 1;">💔</td>
        </tr>
    </table>
`, "Account deleted");

/*
==================================================
2. ORDER EMAILS
==================================================
*/

// Order Placed
export const orderPlacedTemplate = (name, orderId, items, total, shipping, tax, deliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Order Placed!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Thank you <strong style="color: ${BRAND.textColor};">${name}</strong>!</p>
                <p style="margin: 0 0 15px;">Your order has been placed successfully.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">
                    <strong>Order #${orderId}</strong>
                </p>
                <p style="margin: 0 0 15px; font-size: 12px; color: ${BRAND.mutedText};">
                    Expected Delivery: <strong style="color: ${BRAND.textColor};">${deliveryDate}</strong>
                </p>
            </td>
        </tr>
        ${orderSummaryTable(items, total, shipping, tax)}
        <tr>
            <td align="center">
                ${button("Track Order", trackLink)}
            </td>
        </tr>
        <tr>
            <td style="font-size: 12px; color: ${BRAND.mutedText}; line-height: 1.6; padding-top: 10px;">
                <p style="margin: 0;">Need help? Contact us at <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.supportEmail}</a></p>
            </td>
        </tr>
    </table>
`, `Order #${orderId} placed successfully`);

// Order Confirmed
export const orderConfirmedTemplate = (name, orderId, items, total, shipping, tax, deliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Order Confirmed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 15px;">Your order has been confirmed and is being processed.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">
                    <strong>Order #${orderId}</strong>
                </p>
                <p style="margin: 0 0 15px; font-size: 12px; color: ${BRAND.mutedText};">
                    Expected Delivery: <strong style="color: ${BRAND.textColor};">${deliveryDate}</strong>
                </p>
            </td>
        </tr>
        ${orderSummaryTable(items, total, shipping, tax)}
        <tr>
            <td align="center">
                ${button("Track Order", trackLink)}
            </td>
        </tr>
    </table>
`, `Order #${orderId} confirmed`);

// Payment Successful
export const paymentSuccessfulTemplate = (name, orderId, amount, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💳</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Payment Successful</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your payment of <strong style="color: ${BRAND.textColor}; font-size: 18px;">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has been processed successfully.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Order", trackLink)}
            </td>
        </tr>
    </table>
`, `Payment successful for order #${orderId}`);

// Payment Failed
export const paymentFailedTemplate = (name, orderId, amount, retryLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">❌</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">Payment Failed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your payment of <strong style="color: ${BRAND.textColor};">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has failed.</p>
                <p style="margin: 0 0 15px;">Don't worry — your order is still pending. Please try again with a different payment method.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Retry Payment", retryLink, "#ef4444")}
            </td>
        </tr>
        <tr>
            <td style="font-size: 12px; color: ${BRAND.mutedText}; line-height: 1.6; padding-top: 10px;">
                <p style="margin: 0;">Need help? Contact <a href="mailto:${BRAND.supportEmail}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.supportEmail}</a></p>
            </td>
        </tr>
    </table>
`, `Payment failed for order #${orderId}`);

// Order Packed
export const orderPackedTemplate = (name, orderId, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📦</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Your Order is Packed!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your order <strong>#${orderId}</strong> has been packed and is ready to be shipped.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Order", trackLink)}
            </td>
        </tr>
    </table>
`, `Order #${orderId} packed`);

// Order Shipped
export const orderShippedTemplate = (name, orderId, courierName, trackingNumber, deliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🚚</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Your Order is on the Way!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your order <strong>#${orderId}</strong> has been shipped via <strong style="color: ${BRAND.textColor};">${courierName}</strong>.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">Tracking Number: <strong>${trackingNumber}</strong></p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.mutedText};">Estimated Delivery: <strong style="color: ${BRAND.textColor};">${deliveryDate}</strong></p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Your Package", trackLink)}
            </td>
        </tr>
    </table>
`, `Order #${orderId} shipped via ${courierName}`);

// Order Out For Delivery
export const orderOutForDeliveryTemplate = (name, orderId, deliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📬</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Out for Delivery!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your order <strong>#${orderId}</strong> is out for delivery and will arrive today!</p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.mutedText};">Expected Delivery: <strong style="color: ${BRAND.textColor};">${deliveryDate}</strong></p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Live", trackLink)}
            </td>
        </tr>
    </table>
`, `Order #${orderId} out for delivery`);

// Order Delivered
export const orderDeliveredTemplate = (name, orderId, reviewLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Delivered!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your order <strong>#${orderId}</strong> has been delivered. We hope you love your purchase!</p>
                <p style="margin: 0 0 10px;">Love what you got? Share your experience with a review!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Write a Review", reviewLink, "#22c55e")}
            </td>
        </tr>
    </table>
`, `Order #${orderId} delivered`);

// Order Cancelled
export const orderCancelledTemplate = (name, orderId, refundAmount, reason) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">❌</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Order Cancelled</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your order <strong>#${orderId}</strong> has been cancelled.</p>
                ${reason ? `<p style="margin: 0 0 10px; padding: 10px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; font-style: italic;">Reason: ${reason}</p>` : ""}
                ${refundAmount ? `<p style="margin: 0 0 15px;">A refund of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${refundAmount.toFixed(2)}</strong> will be processed within 5-7 business days.</p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Again", `${BRAND.website}/shop`)}
            </td>
        </tr>
    </table>
`, `Order #${orderId} cancelled`);

// Invoice Generated
export const invoiceGeneratedTemplate = (name, orderId, invoiceLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📄</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Invoice Generated</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your invoice for order <strong>#${orderId}</strong> is now available for download.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Download Invoice", invoiceLink)}
            </td>
        </tr>
    </table>
`, `Invoice for order #${orderId}`);

/*
==================================================
3. SHIPPING EMAILS
==================================================
*/

// Courier Assigned
export const courierAssignedTemplate = (name, orderId, courierName, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📦</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Courier Assigned</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;"><strong style="color: ${BRAND.textColor};">${courierName}</strong> has been assigned to deliver your order <strong>#${orderId}</strong>.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Order", trackLink)}
            </td>
        </tr>
    </table>
`, `Courier assigned for order #${orderId}`);

// Tracking Number Generated
export const trackingGeneratedTemplate = (name, orderId, courierName, trackingNumber, deliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🔢</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Tracking Number Generated</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 5px;">Your tracking number for order <strong>#${orderId}</strong> is ready.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">
                    Courier: <strong>${courierName}</strong>
                </p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">
                    Tracking: <strong>${trackingNumber}</strong>
                </p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.mutedText};">
                    Estimated Delivery: <strong style="color: ${BRAND.textColor};">${deliveryDate}</strong>
                </p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Your Package", trackLink)}
            </td>
        </tr>
    </table>
`, `Tracking number for order #${orderId}`);

// Package Delayed
export const packageDelayedTemplate = (name, orderId, newDeliveryDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">⏰</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #f59e0b; margin: 0;">Package Delayed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We're sorry, but your order <strong>#${orderId}</strong> has been delayed due to unforeseen circumstances.</p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.mutedText};">
                    New Estimated Delivery: <strong style="color: ${BRAND.textColor};">${newDeliveryDate}</strong>
                </p>
                <p style="margin: 0 0 10px;">We apologize for the inconvenience and appreciate your patience.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Order", trackLink, "#f59e0b")}
            </td>
        </tr>
    </table>
`, `Package delayed for order #${orderId}`);

// Delivery Rescheduled
export const deliveryRescheduledTemplate = (name, orderId, newDate, trackLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Delivery Rescheduled</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your delivery for order <strong>#${orderId}</strong> has been rescheduled.</p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.mutedText};">
                    New Delivery Date: <strong style="color: ${BRAND.textColor};">${newDate}</strong>
                </p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Order", trackLink)}
            </td>
        </tr>
    </table>
`, `Delivery rescheduled for order #${orderId}`);

// Package Delivered
export const packageDeliveredTemplate = (name, orderId, reviewLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Package Delivered</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your package for order <strong>#${orderId}</strong> has been delivered successfully.</p>
                <p style="margin: 0 0 10px;">How was your experience? Let us know!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Leave a Review", reviewLink, "#22c55e")}
            </td>
        </tr>
    </table>
`, `Package delivered for order #${orderId}`);

/*
==================================================
4. RETURN & REFUND EMAILS
==================================================
*/

// Return Requested
export const returnRequestedTemplate = (name, orderId, returnId, reason, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📦</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Return Request Received</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We've received your return request for order <strong>#${orderId}</strong>.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">Return ID: <strong>${returnId}</strong></p>
                <p style="margin: 0 0 15px; padding: 10px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; font-style: italic;">Reason: ${reason}</p>
                <p style="margin: 0 0 10px;">Our team will review your request and get back to you within 24-48 hours.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Return Status", returnLink)}
            </td>
        </tr>
    </table>
`, `Return request received for order #${orderId}`);

// Return Approved
export const returnApprovedTemplate = (name, orderId, returnId, instructions, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Return Approved</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your return request <strong>${returnId}</strong> for order <strong>#${orderId}</strong> has been approved!</p>
                ${instructions ? `<p style="margin: 0 0 15px; padding: 10px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; color: ${BRAND.textColor};">${instructions}</p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Return Details", returnLink, "#22c55e")}
            </td>
        </tr>
    </table>
`, `Return approved for order #${orderId}`);

// Return Rejected
export const returnRejectedTemplate = (name, orderId, returnId, reason, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">❌</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">Return Request Rejected</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We're sorry, but your return request <strong>${returnId}</strong> for order <strong>#${orderId}</strong> has been rejected.</p>
                <p style="margin: 0 0 15px; padding: 10px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; font-style: italic;">Reason: ${reason}</p>
                <p style="margin: 0 0 10px;">If you have any questions, please contact our support team.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Contact Support", `mailto:${BRAND.supportEmail}`, "#ef4444")}
            </td>
        </tr>
    </table>
`, `Return rejected for order #${orderId}`);

// Pickup Scheduled
export const pickupScheduledTemplate = (name, orderId, pickupDate, pickupAddress, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Pickup Scheduled</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">A pickup has been scheduled for your return from order <strong>#${orderId}</strong>.</p>
                <p style="margin: 0 0 5px; font-size: 13px; color: ${BRAND.textColor};">
                    Pickup Date: <strong>${pickupDate}</strong>
                </p>
                <p style="margin: 0 0 15px; font-size: 13px; color: ${BRAND.textColor};">
                    Pickup Address: <strong>${pickupAddress}</strong>
                </p>
                <p style="margin: 0 0 10px;">Please ensure your item is properly packed and ready for pickup.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Return Details", returnLink)}
            </td>
        </tr>
    </table>
`, `Pickup scheduled for order #${orderId}`);

// Item Received
export const itemReceivedTemplate = (name, orderId, returnId, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📦</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Item Received</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We've received the returned item for order <strong>#${orderId}</strong> (Return ID: <strong>${returnId}</strong>).</p>
                <p style="margin: 0 0 10px;">Our team will inspect the item and process your refund within 3-5 business days.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Track Refund Status", returnLink)}
            </td>
        </tr>
    </table>
`, `Return item received for order #${orderId}`);

// Refund Initiated
export const refundInitiatedTemplate = (name, orderId, amount, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💰</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Refund Initiated</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your refund of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has been initiated.</p>
                <p style="margin: 0 0 10px;">The amount will be credited to your original payment method within 5-7 business days.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Refund Details", returnLink)}
            </td>
        </tr>
    </table>
`, `Refund initiated for order #${orderId}`);

// Refund Completed
export const refundCompletedTemplate = (name, orderId, amount, returnLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Refund Completed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your refund of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has been completed.</p>
                <p style="margin: 0 0 10px;">The amount has been credited to your original payment method. Please allow a few days for it to reflect in your account.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Again", `${BRAND.website}/shop`, "#22c55e")}
            </td>
        </tr>
    </table>
`, `Refund completed for order #${orderId}`);

/*
==================================================
5. PAYMENT EMAILS
==================================================
*/

// Refund Successful
export const refundSuccessfulTemplate = (name, orderId, amount) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✅</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #22c55e; margin: 0;">Refund Successful</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">A refund of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has been successfully processed.</p>
            </td>
        </tr>
    </table>
`, `Refund successful for order #${orderId}`);

// Refund Failed
export const refundFailedTemplate = (name, orderId, amount, reason) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">❌</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">Refund Failed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We're sorry, but the refund of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${amount.toFixed(2)}</strong> for order <strong>#${orderId}</strong> has failed.</p>
                ${reason ? `<p style="margin: 0 0 15px; padding: 10px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; font-style: italic;">Reason: ${reason}</p>` : ""}
                <p style="margin: 0 0 10px;">Please contact our support team to resolve this issue.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Contact Support", `mailto:${BRAND.supportEmail}`, "#ef4444")}
            </td>
        </tr>
    </table>
`, `Refund failed for order #${orderId}`);

// COD Confirmed
export const codConfirmedTemplate = (name, orderId, amount) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💵</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">COD Order Confirmed</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Your Cash on Delivery order <strong>#${orderId}</strong> has been confirmed.</p>
                <p style="margin: 0 0 10px;">Amount to be paid on delivery: <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${amount.toFixed(2)}</strong></p>
                <p style="margin: 0;">Please keep the exact amount ready at the time of delivery.</p>
            </td>
        </tr>
    </table>
`, `COD confirmed for order #${orderId}`);

/*
==================================================
6. WISHLIST EMAILS
==================================================
*/

// Back in Stock
export const backInStockTemplate = (name, productName, productLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Back in Stock!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Good news! <strong style="color: ${BRAND.textColor};">${productName}</strong> is back in stock and available for purchase.</p>
                <p style="margin: 0 0 10px;">Don't wait too long — items like this sell out fast!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Now", productLink, "#22c55e")}
            </td>
        </tr>
    </table>
`, `${productName} is back in stock!`);

// Price Dropped
export const priceDroppedTemplate = (name, productName, oldPrice, newPrice, productLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💰</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Price Dropped!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">The price of <strong style="color: ${BRAND.textColor};">${productName}</strong> has dropped!</p>
                <p style="margin: 0 0 5px; font-size: 16px;">
                    <span style="color: ${BRAND.mutedText}; text-decoration: line-through;">$${oldPrice.toFixed(2)}</span>
                    <span style="color: #22c55e; font-weight: 800; font-size: 24px; margin-left: 10px;">$${newPrice.toFixed(2)}</span>
                </p>
                <p style="margin: 0 0 10px; font-size: 12px; color: #22c55e;">You save $${(oldPrice - newPrice).toFixed(2)}!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Grab the Deal", productLink, "#22c55e")}
            </td>
        </tr>
    </table>
`, `Price dropped on ${productName} - Now $${newPrice.toFixed(2)}`);

// Limited Stock
export const limitedStockTemplate = (name, productName, quantity, productLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">⚡</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #f59e0b; margin: 0;">Limited Stock Alert!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;"><strong style="color: ${BRAND.textColor};">${productName}</strong> is running low on stock!</p>
                <p style="margin: 0 0 10px; font-size: 13px; color: ${BRAND.textColor};">
                    Only <strong style="color: #ef4444; font-size: 18px;">${quantity}</strong> left in stock
                </p>
                <p style="margin: 0 0 10px;">Don't miss out — grab yours before they're gone!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Now", productLink, "#f59e0b")}
            </td>
        </tr>
    </table>
`, `Limited stock: ${productName}`);

// Flash Sale Started
export const flashSaleStartedTemplate = (name, productName, discount, productLink, endsIn) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🔥</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">Flash Sale is Live!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;"><strong style="color: ${BRAND.textColor};">${productName}</strong> is now on flash sale!</p>
                <p style="margin: 0 0 5px; font-size: 20px; font-weight: 800; color: #ef4444;">
                    ${discount}% OFF
                </p>
                ${endsIn ? `<p style="margin: 0 0 10px; font-size: 12px; color: ${BRAND.mutedText};">Ends in: ${endsIn}</p>` : ""}
                <p style="margin: 0 0 10px;">Hurry, this offer won't last long!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Flash Sale", productLink, "#ef4444")}
            </td>
        </tr>
    </table>
`, `Flash sale: ${discount}% off on ${productName}`);

// Wishlist Discontinued
export const wishlistDiscontinuedTemplate = (name, productName) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">😔</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Item Discontinued</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hi <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">We're sorry, but <strong style="color: ${BRAND.textColor};">${productName}</strong> has been discontinued and is no longer available.</p>
                <p style="margin: 0 0 10px;">Check out similar products we think you'll love!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Browse Similar", `${BRAND.website}/shop`)}
            </td>
        </tr>
    </table>
`, `${productName} discontinued`);

/*
==================================================
7. PROMOTIONAL EMAILS
==================================================
*/

// New Arrivals
export const newArrivalsTemplate = (name, collectionName, shopLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✨</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 28px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">New Arrivals</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 15px;">
                <span style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.6;">
                    Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, check out what's new!
                </span>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 10px;">Our ${collectionName ? `<strong style="color: ${BRAND.textColor};">${collectionName}</strong>` : "latest collection"} has just dropped. Be the first to rock the freshest styles.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Explore New Arrivals", shopLink)}
            </td>
        </tr>
    </table>
`, `New arrivals just dropped!`);

// Weekend Sale
export const weekendSaleTemplate = (name, discount, shopLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 28px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Weekend Sale!</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                <span style="font-size: 36px; font-weight: 900; color: ${BRAND.primaryColor};">${discount}% OFF</span>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Weekend is here, and so are the deals! Enjoy ${discount}% off on everything.</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    Use Code: ${couponCode}
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Weekend Sale", shopLink)}
            </td>
        </tr>
    </table>
`, `Weekend Sale: ${discount}% OFF!`);

// Flash Sale
export const flashSaleTemplate = (name, discount, shopLink, couponCode, endsIn) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">⚡</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 28px; font-weight: 800; color: #ef4444; margin: 0;">FLASH SALE!</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                <span style="font-size: 36px; font-weight: 900; color: #ef4444;">${discount}% OFF</span>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Flash sale is live! Get ${discount}% off on selected items.</p>
                ${endsIn ? `<p style="margin: 0 0 10px; font-size: 13px; color: #ef4444; font-weight: 600;">⏰ Hurry! Ends in ${endsIn}</p>` : ""}
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: #ef4444;">
                    Use Code: ${couponCode}
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Flash Sale", shopLink, "#ef4444")}
            </td>
        </tr>
    </table>
`, `⚡ Flash Sale: ${discount}% OFF!`);

// Festival Sale
export const festivalSaleTemplate = (name, festivalName, discount, shopLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎊</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 28px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">${festivalName} Sale!</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                <span style="font-size: 36px; font-weight: 900; color: ${BRAND.primaryColor};">${discount}% OFF</span>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Celebrate ${festivalName} with us! Enjoy ${discount}% off on your favorite styles.</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    Use Code: ${couponCode}
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop the Sale", shopLink)}
            </td>
        </tr>
    </table>
`, `🎊 ${festivalName} Sale: ${discount}% OFF!`);

// Exclusive Offer
export const exclusiveOfferTemplate = (name, offer, shopLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💎</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Exclusive Offer Just for You</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">You've been selected for an exclusive offer: <strong style="color: ${BRAND.textColor}; font-size: 16px;">${offer}</strong></p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    Use Code: ${couponCode}
                </p>` : ""}
                <p style="margin: 0 0 10px; font-size: 12px; color: ${BRAND.mutedText};">This offer is valid for a limited time only.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Claim Your Offer", shopLink)}
            </td>
        </tr>
    </table>
`, `Exclusive offer: ${offer}`);

// Birthday Discount
export const birthdayDiscountTemplate = (name, discount, shopLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎂</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Happy Birthday!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Wishing you the most amazing day! Here's a special birthday treat just for you:</p>
                <p style="margin: 0 0 10px; font-size: 28px; font-weight: 900; color: ${BRAND.primaryColor}; text-align: center;">${discount}% OFF</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    Use Code: ${couponCode}
                </p>` : ""}
                <p style="margin: 0 0 10px; font-size: 12px; color: ${BRAND.mutedText};">Valid for 7 days. Treat yourself!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Claim Birthday Gift", shopLink)}
            </td>
        </tr>
    </table>
`, `🎂 Happy Birthday ${name}! Enjoy ${discount}% OFF!`);

// Anniversary Discount
export const anniversaryDiscountTemplate = (name, years, discount, shopLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🎉</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">${years} Year Anniversary!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">It's been ${years} amazing year${years > 1 ? "s" : ""} with you! To celebrate, here's an exclusive discount:</p>
                <p style="margin: 0 0 10px; font-size: 28px; font-weight: 900; color: ${BRAND.primaryColor}; text-align: center;">${discount}% OFF</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    Use Code: ${couponCode}
                </p>` : ""}
                <p style="margin: 0 0 10px;">Thank you for being a valued member of our community.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Claim Your Reward", shopLink)}
            </td>
        </tr>
    </table>
`, `🎉 ${years} year anniversary! Enjoy ${discount}% OFF!`);

// Limited Time Deal
export const limitedTimeDealTemplate = (name, productName, discount, price, shopLink, endsIn) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">⏰</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Limited Time Deal!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;"><strong style="color: ${BRAND.textColor};">${productName}</strong> is available at an unbeatable price!</p>
                <p style="margin: 0 0 5px; font-size: 16px;">
                    ${discount ? `<span style="color: ${BRAND.mutedText}; text-decoration: line-through;">$${price.toFixed(2)}</span>` : ""}
                    <span style="color: #ef4444; font-weight: 800; font-size: 28px; margin-left: 10px;">$${price.toFixed(2)}</span>
                </p>
                ${discount ? `<p style="margin: 0 0 10px; font-size: 12px; color: #22c55e;">${discount}% OFF!</p>` : ""}
                ${endsIn ? `<p style="margin: 0 0 10px; font-size: 13px; color: #ef4444; font-weight: 600;">⏰ Offer ends in ${endsIn}</p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Grab the Deal", shopLink, "#ef4444")}
            </td>
        </tr>
    </table>
`, `Limited time deal on ${productName}`);

// Trending Products
export const trendingProductsTemplate = (name, shopLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🔥</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Trending Now</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Here's what everyone's loving right now. Stay ahead of the fashion game!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("See What's Trending", shopLink)}
            </td>
        </tr>
    </table>
`, `Trending products you'll love`);

// Recommended Products
export const recommendedProductsTemplate = (name, shopLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💡</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Handpicked for You</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Based on your style, we've picked out some items we think you'll absolutely love.</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Recommendations", shopLink)}
            </td>
        </tr>
    </table>
`, `Personalized recommendations for you`);

// Best Sellers
export const bestSellersTemplate = (name, shopLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🏆</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Best Sellers</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">Our most popular items loved by thousands. Don't miss out on these crowd favorites!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Shop Best Sellers", shopLink)}
            </td>
        </tr>
    </table>
`, `Best sellers you need to see`);

// Recently Viewed Reminder
export const recentlyViewedTemplate = (name, productName, shopLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">👀</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Still Thinking About It?</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">You recently viewed <strong style="color: ${BRAND.textColor};">${productName}</strong>. It's still available and waiting for you!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Product", shopLink)}
            </td>
        </tr>
    </table>
`, `You recently viewed ${productName}`);

// Cart Reminder
export const cartReminderTemplate = (name, items, total, cartLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🛒</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Your Cart is Waiting!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">You have ${items} item${items > 1 ? "s" : ""} in your cart with a total of <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${total.toFixed(2)}</strong>.</p>
                <p style="margin: 0 0 10px;">Don't let your favorites get away — complete your purchase now!</p>
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("View Cart & Checkout", cartLink)}
            </td>
        </tr>
    </table>
`, `You have ${items} item${items > 1 ? "s" : ""} in your cart`);

/*
==================================================
8. CART RECOVERY EMAILS
==================================================
*/

// Cart Recovery 2 Hours
export const cartRecovery2hTemplate = (name, items, total, cartLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">🛒</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Forget Something?</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">You left some items in your cart ${items} item${items > 1 ? "s" : ""}, <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${total.toFixed(2)}</strong>.</p>
                <p style="margin: 0 0 10px;">They're still available — complete your order now!</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 14px; letter-spacing: 1px; font-weight: 700; color: ${BRAND.primaryColor};">
                    🎉 Free Shipping Code: <span style="font-size: 18px; letter-spacing: 2px;">${couponCode}</span>
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Complete Your Order", cartLink)}
            </td>
        </tr>
    </table>
`, `You left items in your cart`);

// Cart Recovery 24 Hours
export const cartRecovery24hTemplate = (name, items, total, cartLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">⏰</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Still Interested?</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">It's been 24 hours — your cart (${items} item${items > 1 ? "s" : ""}, <strong style="color: ${BRAND.textColor}; font-size: 16px;">$${total.toFixed(2)}</strong>) is still waiting.</p>
                <p style="margin: 0 0 10px;">We've saved it for you, but it might not last forever!</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 14px; letter-spacing: 1px; font-weight: 700; color: ${BRAND.primaryColor};">
                    🎁 Exclusive: ${couponCode} — ${items > 1 ? "15% OFF" : "10% OFF"}
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Complete Your Order", cartLink)}
            </td>
        </tr>
    </table>
`, `Your cart is still waiting!`);

// Cart Recovery 3 Days
export const cartRecovery3dTemplate = (name, items, total, cartLink, couponCode) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">💝</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">We Miss You!</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                <p style="margin: 0 0 5px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 10px;">It's been 3 days since you left ${items} item${items > 1 ? "s" : ""} (<strong style="color: ${BRAND.textColor}; font-size: 16px;">$${total.toFixed(2)}</strong>) in your cart.</p>
                <p style="margin: 0 0 10px;">As a special welcome back, enjoy this exclusive discount!</p>
                ${couponCode ? `
                <p style="margin: 0 0 15px; padding: 12px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; text-align: center; font-size: 16px; letter-spacing: 2px; font-weight: 700; color: ${BRAND.primaryColor};">
                    🎁 Use Code: ${couponCode}
                    <br>
                    <span style="font-size: 12px; color: ${BRAND.mutedText};">20% OFF your entire order</span>
                </p>` : ""}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Come Back & Shop", cartLink)}
            </td>
        </tr>
    </table>
`, `We miss you! Here's a special discount`);

/*
==================================================
9. NEWSLETTER EMAILS
==================================================
*/

// Newsletter Base
export const newsletterTemplate = (name, content, newsletterLink) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">📬</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 5px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">${name}</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8;">
                ${content}
            </td>
        </tr>
        <tr>
            <td align="center">
                ${button("Read More", newsletterLink)}
            </td>
        </tr>
    </table>
`, name);

// Weekly Newsletter
export const weeklyNewsletterTemplate = (name, highlights, newsletterLink) => newsletterTemplate(
    "This Week in Fashion",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, here's your weekly fashion roundup!</p>
    ${highlights || "<p style='margin: 0;'>Check out what's new and trending this week.</p>"}`,
    newsletterLink
);

// Monthly Newsletter
export const monthlyNewsletterTemplate = (name, highlights, newsletterLink) => newsletterTemplate(
    "Monthly Style Digest",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, here's your monthly style guide!</p>
    ${highlights || "<p style='margin: 0;'>Catch up on this month's top stories and trends.</p>"}`,
    newsletterLink
);

// Fashion Tips
export const fashionTipsTemplate = (name, tip, newsletterLink) => newsletterTemplate(
    "Style Tips & Tricks",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, elevate your style with these fashion tips!</p>
    ${tip ? `<p style="margin: 0 0 10px; padding: 15px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; font-style: italic;">${tip}</p>` : ""}`,
    newsletterLink
);

// Trending Collections
export const trendingCollectionsTemplate = (name, collectionName, newsletterLink) => newsletterTemplate(
    "Trending Collections",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, discover the hottest collections right now!</p>
    ${collectionName ? `<p style="margin: 0 0 10px;">Don't miss <strong style="color: ${BRAND.textColor};">${collectionName}</strong> — everyone's talking about it.</p>` : ""}`,
    newsletterLink
);

// Style Guides
export const styleGuidesTemplate = (name, guideTopic, newsletterLink) => newsletterTemplate(
    "Style Guides",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, master your look with our latest style guide!</p>
    ${guideTopic ? `<p style="margin: 0 0 10px;">This week: <strong style="color: ${BRAND.textColor};">${guideTopic}</strong></p>` : ""}`,
    newsletterLink
);

// Upcoming Sales
export const upcomingSalesTemplate = (name, saleDetails, newsletterLink) => newsletterTemplate(
    "Upcoming Sales & Events",
    `<p style="margin: 0 0 10px;">Hey <strong style="color: ${BRAND.textColor};">${name}</strong>, get ready for amazing deals coming your way!</p>
    ${saleDetails ? `<p style="margin: 0 0 10px; padding: 15px; background-color: ${BRAND.backgroundColor}; border-radius: 8px; color: ${BRAND.primaryColor}; font-weight: 600;">${saleDetails}</p>` : ""}
    <p style="margin: 0;">Mark your calendar and don't miss out!</p>`,
    newsletterLink
);

// Welcome / Confirmation Template for Newsletter Subscribers
export const welcomeNewsletterTemplate = (name = "there", siteUrl = "") => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✨</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 8px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0; letter-spacing: 1px;">WELCOME TO ATELIER</h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 20px;">
                <p style="font-size: 14px; color: ${BRAND.primaryColor}; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Subscription Confirmed</p>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8; padding-bottom: 25px;">
                <p style="margin: 0 0 12px;">Hello <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 12px;">Thank you for subscribing to the Atelier journal. You are now part of our private inner circle.</p>
                <p style="margin: 0 0 12px;">Here is what you can look forward to:</p>
                <ul style="margin: 0 0 20px; padding-left: 20px; color: ${BRAND.mutedText};">
                    <li style="margin-bottom: 6px;"><strong style="color: ${BRAND.textColor};">Early Access:</strong> First look at new seasonal capsule drops & curated collections.</li>
                    <li style="margin-bottom: 6px;"><strong style="color: ${BRAND.textColor};">Exclusive Offers:</strong> Private discounts & VIP member promotions.</li>
                    <li style="margin-bottom: 6px;"><strong style="color: ${BRAND.textColor};">Curated Edits:</strong> Fashion editorials, styling journals, and design notes.</li>
                </ul>
                <p style="margin: 0;">We craft thoughtful pieces designed to outlast the season.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                ${button("Explore The Collection", siteUrl || BRAND.website)}
            </td>
        </tr>
    </table>
`, `Welcome to the Atelier community — your subscription is confirmed.`);

// Email Verification Template
export const emailVerificationTemplate = (name = "there", verificationLink = "") => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 48px; line-height: 1; padding-bottom: 15px;">✉️</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 8px;">
                <h1 style="font-size: 24px; font-weight: 800; color: ${BRAND.textColor}; margin: 0;">Confirm Your Subscription</h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8; padding-bottom: 25px;">
                <p style="margin: 0 0 12px;">Hello <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <p style="margin: 0 0 12px;">Please confirm your email address to complete your subscription to Atelier newsletters.</p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                ${button("Confirm Subscription", verificationLink)}
            </td>
        </tr>
    </table>
`, `Please confirm your newsletter subscription to Atelier.`);

// Broadcast / Custom Newsletter Template
export const broadcastNewsletterTemplate = ({
    title = "Atelier News & Updates",
    headline = "",
    message = "",
    buttonText = "Shop Atelier",
    buttonUrl = "",
    name = "there"
}) => baseWrapper(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="font-size: 44px; line-height: 1; padding-bottom: 15px;">🛍️</td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 8px;">
                <h1 style="font-size: 22px; font-weight: 800; color: ${BRAND.textColor}; margin: 0; letter-spacing: 1px;">
                    ${headline || title}
                </h1>
            </td>
        </tr>
        <tr>
            <td style="font-size: 14px; color: ${BRAND.mutedText}; line-height: 1.8; padding-bottom: 25px;">
                <p style="margin: 0 0 14px;">Hello <strong style="color: ${BRAND.textColor};">${name}</strong>,</p>
                <div style="margin: 0 0 16px; color: ${BRAND.textColor}; font-size: 14px; line-height: 1.8; white-space: pre-line;">
                    ${message}
                </div>
            </td>
        </tr>
        ${buttonUrl ? `
        <tr>
            <td align="center" style="padding-bottom: 15px;">
                ${button(buttonText || "Discover More", buttonUrl)}
            </td>
        </tr>
        ` : ""}
    </table>
`, headline || title);

