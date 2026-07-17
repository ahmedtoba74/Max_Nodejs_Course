import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: Object,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    user: {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
    },
});

export default mongoose.model("Order", orderSchema);
