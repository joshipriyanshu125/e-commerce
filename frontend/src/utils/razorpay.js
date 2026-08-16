const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
  if (existing) {
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay")), { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = RAZORPAY_SCRIPT_URL;
  script.async = true;
  script.onload = resolve;
  script.onerror = () => reject(new Error("Unable to load Razorpay"));
  document.body.appendChild(script);
});
