import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
            },
        ],
        totalPrice: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

cartSchema.pre("save", async function (next) {
    let total = 0;
    for (const item of this.items) {
        const product = await mongoose.model("Product").findById(item.product);
        if (product) {
            total += product.price * item.quantity;
        }
    }
    this.totalPrice = total;
    next();
});

const cartModel = mongoose.model("Cart", cartSchema);
export default cartModel;
