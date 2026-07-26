import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, "Product must have a title"],
    },
    price: {
        type: Number,
        required: [true, "Product must have a price"],
    },
    description: {
        type: String,
        required: [true, "Product must have a description"],
    },
    image: {
        type: String,
        required: [true, "Product must have an image"],
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
});

export default mongoose.model("Product", productSchema);
