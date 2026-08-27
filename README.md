# e-commerce

## Razorpay payments

The checkout uses Razorpay Standard Checkout. Copy `backend/.env.example` to `backend/.env` and add Razorpay **test** keys before running the app. The key secret and webhook secret must remain on the backend.

In the Razorpay Dashboard, add the production webhook URL `https://your-api-domain/api/payments/webhook`, set the same `RAZORPAY_WEBHOOK_SECRET`, and enable `payment.captured`. Use test mode first, then replace the test keys with live keys only after a successful end-to-end test.

The backend recalculates product prices from MongoDB, creates the Razorpay order, and verifies the HMAC signature before marking the local order paid. Configure catalogue prices in INR when `RAZORPAY_CURRENCY=INR`.

An e-commerce website is an online platform where people can buy and sell products or services over the internet. It allows users to browse items, add them to a cart, make payments, and get products delivered, while sellers manage products, orders, and customers digitally.
