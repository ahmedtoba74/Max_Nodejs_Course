import mongoose from "mongoose";
import validator from "validator";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "User must have a name"],
        validator: {
            validator: function (v) {
                return /^[a-zA-Z\u0600-\u06FF ]+$/.test(v);
            },
            message: "Name must only contain letters",
        },
    },
    email: {
        type: String,
        validate: [validator.isEmail, "Please provide a valid email"],
        lowercase: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    cart: {
        items: [
            {
                productId: {
                    type: mongoose.Schema.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
});

userSchema.methods.addToCart = function (product) {
    if (!this.cart || !this.cart.items) {
        this.cart = { items: [] };
    }
    const cartProductIndex = this.cart.items.findIndex((cb) => {
        return cb.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    }
    const updatedCart = {
        items: updatedCartItems,
    };

    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
    console.log("Product ID: ", productId);
    const updatedCartItems = this.cart.items.filter((item) => {
        console.log(
            `Item id: ${item.productId.toString()} |||| Product id: ${productId.toString()}`,
        );
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

export default mongoose.model("User", userSchema);
