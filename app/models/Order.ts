import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    // User identification
    user: { 
      type: String, 
      required: true, 
      index: true // Searching fast karne ke liye profile page par
    },
    
    // Customer Details
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Shipping Address
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    // Cart Items (Aapke checkout logic ke hisaab se)
    cartItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        designName: { type: String, required: true },
        designCode: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        image: { type: String },
      },
    ],

    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "COD" },

    // Manufacturing & Delivery Status
    // Received -> Fabric Sourcing -> Printing -> Quality Check -> Shipped -> Delivered
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
    
    trackingId: { type: String }, // Delivery partner ka ID
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Order = models.Order || model("Order", OrderSchema);
export default Order;