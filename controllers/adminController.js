import { validationResult } from "express-validator";

import Product from "../models/productModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { deleteFile } from "../utils/file.js";

export const getAddProduct = (req, res, next) => {
    res.status(200).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        edit: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

export const postAddProduct = catchAsync(async (req, res, next) => {
    const { title, price, description } = req.body;
    const image = req.file;

    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            edit: false,
            product: { title, price, description },
            hasError: true,
            errorMessage: "Please provide an image",
            validationErrors: [],
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            edit: false,
            product: { title, image, price, description },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const imageUrl = image.path;
    const userId = req.user._id;
    const product = await Product.create({
        title,
        price,
        description,
        image: imageUrl,
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
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
});

export const postEditProduct = catchAsync(async (req, res, next) => {
    const { title, price, description, productId } = req.body;
    const image = req.file;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            edit: true,
            product: { title, price, description, _id: productId, id: productId },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const product = await Product.findById(productId);

    product.title = title;
    product.price = price;
    product.description = description;
    if (image) {
        deleteFile(product.image);
        product.image = image.path;
    }

    await product.save();

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
    const product = await Product.findById(productId);
    if (product) {
        deleteFile(product.image);
        await Product.findByIdAndDelete(productId);
    }
    res.redirect("/admin/products");
});
