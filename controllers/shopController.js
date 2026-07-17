import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import catchAsync from "../utils/catchAsync.js";
import User from "../models/userModel.js";

export const getIndex = catchAsync(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
    });
});

export const getProducts = catchAsync(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
    });
});

export const getProductDetails = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    res.status(200).render("shop/product-details", {
        pageTitle: product.title,
        path: "/products",
        product,
    });
});

export const getCart = catchAsync(async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items;
    res.status(200).render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products,
    });
});

export const postCart = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    await req.user.addToCart(product);
    return res.redirect("/cart");
});

export const postCartDeleteProduct = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    await req.user.removeFromCart(productId);
    res.redirect("/cart");
});

export const getCheckout = (req, res, next) => {
    res.status(200).render("shop/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
    });
};

export const postOrder = catchAsync(async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items.map((i) => {
        return {
            quantity: i.quantity,
            product: { ...i.productId._doc },
        };
    });
    const order = new Order({
        user: {
            name: req.user.name,
            email: req.user.email,
            userId: req.user,
        },
        products: products,
    });

    await order.save();
    req.user.clearCart();
    res.redirect("orders");
});

export const getOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({ "user.userId": req.user._id });
    res.status(200).render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders,
    });
});
