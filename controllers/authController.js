import crypto from "crypto";

import bycrypt from "bcryptjs";
import { validationResult } from "express-validator";

import Email from "../services/email.js";

import User from "../models/userModel.js";

import catchAsync from "../utils/catchAsync.js";
import path from "path";

export const getLogin = catchAsync(async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        },
        validationErrors: [],
    });
});

export const postLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash("error", errors.array()[0].msg);
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email,
                password,
            },
            validationErrors: errors.array(),
        });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bycrypt.compare(password, user.password))) {
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid Email or password.",
            oldInput: {
                email,
                password,
            },
            validationErrors: [],
        });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;

    req.session.save((err) => {
        if (err) console.log(err);

        res.redirect("/");
    });
});

export const getSignup = catchAsync(async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.status(200).render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: message,
        oldInput: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationErrors: [],
    });
});

export const postSignup = catchAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash("error", errors.array()[0].msg);
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name,
                email,
                password,
                confirmPassword,
            },
            validationErrors: errors.array(),
        });
    }

    const hashedPassword = await bycrypt.hash(password, 12);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        cart: { items: [] },
    });

    new Email(newUser, process.env.BASE_URL).sendWelcome();

    res.redirect("/login");
});

export const postLogout = catchAsync(async (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect("/");
    });
});

export const getReset = catchAsync(async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.status(200).render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: message,
    });
});

export const postReset = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        req.flash("error", "No account with that email found.");
        return res.redirect("/reset");
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get("host")}/reset/${resetToken}`;

    new Email(user, resetURL).sendPasswordReset();

    res.redirect("/");
});

export const getNewPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const hashedResetToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash("error", "Token is invalid or has expired.");
        return res.redirect("/reset");
    }

    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.status(422).render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        token,
    });
});

export const postNewPassword = catchAsync(async (req, res, next) => {
    const { password, confirmPassword, userId, token } = req.body;

    const hashedResetToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        _id: userId,
        passwordResetToken: hashedResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/reset");
    }

    if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match.");
        return res.redirect(`/reset/${userId}`);
    }
    user.password = await bycrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.redirect("/login");
});
