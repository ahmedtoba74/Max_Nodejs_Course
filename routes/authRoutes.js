import express from "express";
import { check, body } from "express-validator";

import User from "../models/userModel.js";

import * as authController from "../controllers/authController.js";

const router = express.Router();

router
    .route("/login")
    .get(authController.getLogin)
    .post(
        [check("email").isEmail().withMessage("Please enter a valid email.").normalizeEmail()],
        authController.postLogin,
    );
router
    .route("/signup")
    .get(authController.getSignup)
    .post(
        [
            check("email")
                .isEmail()
                .withMessage("Please enter a valid email.")
                .normalizeEmail()
                .custom((value, { req }) =>
                    User.findOne({ email: value }).then((userDoc) => {
                        if (userDoc) {
                            return Promise.reject("E-Mail address already exists!");
                        }
                    }),
                ),
            body("name")
                .isLength({ min: 3 })
                .withMessage("Name must be at least 3 characters long.")
                .trim(),
            body("password")
                .isLength({ min: 6 })
                .withMessage("Password must be at least 6 characters long."),
            body("confirmPassword").custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords have to match!");
                }
                return true;
            }),
        ],
        authController.postSignup,
    );

router.post("/logout", authController.postLogout);

router.route("/reset").get(authController.getReset).post(authController.postReset);
router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

export default router;
