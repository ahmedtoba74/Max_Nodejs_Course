import express from "express";

import * as shopController from "../controllers/shopController.js";
import isAuth from "../middlewares/is-auth.js";

const router = express.Router();

router.get("/", shopController.getIndex);
router.get("/products", shopController.getProducts);
router.get("/products/:productId", shopController.getProductDetails);

router.route("/cart").get(isAuth, shopController.getCart).post(isAuth, shopController.postCart);
router.post("/card-delete-item", isAuth, shopController.postCartDeleteProduct);
router.post("/create-order", isAuth, shopController.postOrder);
router.get("/orders", isAuth, shopController.getOrders);
router.get("/orders/:orderId", isAuth, shopController.getInvoice);

export default router;
