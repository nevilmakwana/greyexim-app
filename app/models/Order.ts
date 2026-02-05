import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    // User identification (optional for guest checkout)
    user: { type: String, index: true },
    isGuest: { type: Boolean, default: false },

    // Customer Details
    customerName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },

    // Shipping Address
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    cartItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        designName: { type: String, required: true },
        designCode: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        image: { type: String, default: "" },
      },
    ],

    // Pricing breakdown (smallest unit is NOT used here; keep rupees as numbers)
    subtotalAmount: { type: Number, required: true },
    shippingAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    promoCode: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // Payment
    paymentMethod: { type: String, default: "COD" }, // COD | STRIPE
    paymentStatus: { type: String, default: "unpaid" }, // unpaid | pending | paid | failed | refunded
    paymentProvider: { type: String, default: "" }, // stripe
    paymentId: { type: String, default: "" }, // payment_intent or provider reference
    stripeSessionId: { type: String, default: "" },

    // Fulfillment Status
    status: {
      type: String,
      default: "Received",
      enum: [
        "Received",
        "Fabric Sourcing",
        "Printing",
        "Quality Check",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
    },
    trackingId: { type: String, default: "" },
  },
  { timestamps: true }
);

const Order = models.Order || model("Order", OrderSchema);
export default Order;

