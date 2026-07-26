import express from "express";
import { check, body } from "express-validator";

import * as adminController from "../controllers/adminController.js";
import isAuth from "../middlewares/is-auth.js";

const router = express.Router();

router.use(isAuth);

router.get("/add-product", adminController.getAddProduct);
router.get("/products", adminController.getProducts);

router.post(
    "/add-product",
    [
        body("title").trim().isLength({ min: 3 }).isString().withMessage("Title is required"),
        body("price").isFloat().withMessage("Price is required"),
        body("description")
            .trim()
            .isLength({ min: 5, max: 400 })
            .withMessage("Description is required"),
    ],
    adminController.postAddProduct,
);

router.get("/edit-product/:productId", adminController.getEditProduct);
router.post(
    "/edit-product",
    [
        body("title").trim().isLength({ min: 3 }).isString().withMessage("Title is required"),
        body("price").isFloat().withMessage("Price is required"),
        body("description")
            .trim()
            .isLength({ min: 5, max: 400 })
            .withMessage("Description is required"),
    ],
    adminController.postEditProduct,
);

router.post("/delete-product", adminController.postDeleteProduct);

export default router;
