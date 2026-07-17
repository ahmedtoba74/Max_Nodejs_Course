import express from "express";

import * as shopController from "../controllers/shopController.js";
import isAuth from "../middlewares/is-auth.js";

const router = express.Router();

router.get("/", shopController.getIndex);
router.get("/products", shopController.getProducts);
router.get("/products/:productId", shopController.getProductDetails);
router.get("/cart", isAuth, shopController.getCart);
router.post("/cart", isAuth, shopController.postCart);
router.post("/card-delete-item", isAuth, shopController.postCartDeleteProduct);
router.post("/create-order", isAuth, shopController.postOrder);
router.get("/orders", isAuth, shopController.getOrders);
// router.get("/checkout", shopController.getCheckout);

export default router;
