import Product from "../models/productModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

export const getAddProduct = (req, res, next) => {
    res.status(200).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        edit: false,
    });
};

export const postAddProduct = catchAsync(async (req, res, next) => {
    const { title, imageUrl, price, description } = req.body;
    const userId = req.user._id;
    const product = await Product.create({
        title,
        price,
        description,
        imageUrl,
        userId,
    });

    res.redirect("/admin/products");
});

export const getEditProduct = catchAsync(async (req, res, next) => {
    const { edit } = req.query;
    if (!edit) return res.redirect("/");

    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) return next(new AppError("Prdoct not found", 404));

    res.status(200).render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        edit,
        product,
    });
});

export const postEditProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(req.body.productId, req.body);
    res.redirect("/admin/products");
});

export const getProducts = catchAsync(async (req, res, next) => {
    const products = await Product.find({ userId: req.user._id });
    res.status(200).render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
    });
});

export const postDeleteProduct = catchAsync(async (req, res, next) => {
    const { productId } = req.body;
    await Product.findByIdAndDelete(productId);
    res.redirect("/admin/products");
});
