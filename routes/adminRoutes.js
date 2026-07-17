import express from "express";

import * as adminController from "../controllers/adminController.js";
import isAuth from "../middlewares/is-auth.js";

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);
router.get("/products", adminController.getProducts);

router.post("/add-product", adminController.postAddProduct);

router.get("/edit-product/:productId", adminController.getEditProduct);
router.post("/edit-product", adminController.postEditProduct);

router.post("/delete-product", adminController.postDeleteProduct);

export default router;
