import "dotenv/config";
import path from "path";

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import csrf from "csurf";
import flash from "connect-flash";
import multer from "multer";

import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import rootDir from "./utils/path.js";
import * as errorController from "./controllers/errorController.js";

import User from "./models/userModel.js";
import { randomBytes } from "crypto";

const app = express();

const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
    uri: process.env.DATABASE.replace("<db_password>", process.env.DATABASE_PASSWORD),
    collection: "session",
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Invalid image file"), false);
    }
};

app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));

app.use(express.static(path.join(rootDir, "/public")));
app.use("/images", express.static(path.join(rootDir, "images")));

app.use(
    session({
        secret: "my secret",
        resave: false,
        saveUninitialized: false,
        store: store,
    }),
);

app.use(csrfProtection);
app.use(flash());

app.use(async (req, res, next) => {
    if (!req.session.user) {
        return next();
    }

    try {
        const user = await User.findById(req.session.user._id);

        if (!user) {
            return next();
        }

        req.user = user;
        next();
    } catch (err) {
        console.log(err);
        next(err);
    }
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();

    next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

const globalErrorHandler = (err, req, res, next) => {
    // Set default values if they don't exist
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";

    res.status(statusCode).json({
        status: status,
        message: err.message,
    });
};

app.use(globalErrorHandler);

const port = process.env.PORT || 3000;

mongoose
    .connect(process.env.DATABASE.replace("<db_password>", process.env.DATABASE_PASSWORD))
    .then(() => {
        app.listen(port, () => {
            console.log(`App is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log("Database connection faild: ", err);
    });
