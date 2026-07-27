import path from "path";
import fs from "fs";

import PDFDocument from "pdfkit";
import Stripe from "stripe";

import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import catchAsync from "../utils/catchAsync.js";

const ITEM_PER_PAGE = 2;

// Initialize Stripe lazily inside functions to ensure process.env.STRIPE_SECRET_KEY is loaded by dotenv

const generateEnterpriseInvoice = (doc, order) => {
    const primaryColor = "#1E293B"; // Slate navy
    const secondaryColor = "#2563EB"; // Indigo blue accent
    const textDark = "#0F172A"; // Body text
    const textMuted = "#64748B"; // Muted text/labels
    const borderColor = "#E2E8F0"; // Table/divider lines
    const bgLight = "#F8FAFC"; // Row background highlight

    const leftMargin = 50;
    const rightMargin = 545; // 595 - 50 (A4 width = 595.28)
    const contentWidth = 495;

    // --- 1. HEADER BRANDING ---
    // Top accent bar
    doc.rect(leftMargin, 40, contentWidth, 4).fill(secondaryColor);

    // Company / Store Branding
    doc.fillColor(primaryColor)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Toba SHOP", leftMargin, 55);

    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text("Official Purchase Receipt & Tax Invoice", leftMargin, 82)
        .text("support@Tobashop.com | www.Tobashop.com", leftMargin, 95);

    // Header Title (Right aligned)
    doc.fillColor(secondaryColor)
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("INVOICE", leftMargin, 55, { align: "right", width: contentWidth });

    // Paid Status Badge
    doc.roundedRect(rightMargin - 65, 87, 65, 18, 9).fillAndStroke("#DCFCE7", "#86EFAC");
    doc.fillColor("#15803D")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("PAID", rightMargin - 65, 91, { align: "center", width: 65 });

    // --- 2. DIVIDER LINE ---
    doc.moveTo(leftMargin, 118)
        .lineTo(rightMargin, 118)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

    // --- 3. CUSTOMER & ORDER METADATA ---
    const infoY = 132;

    // Customer Info Column (Left)
    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILLED TO", leftMargin, infoY);

    doc.fillColor(textDark)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(order.user.name || "Customer", leftMargin, infoY + 15);

    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text(order.user.email || "", leftMargin, infoY + 30);

    // Order Meta Info Column (Right)
    const rightColX = 350;
    const rightColWidth = rightMargin - rightColX;

    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("INVOICE DETAILS", rightColX, infoY);

    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text("Order ID:", rightColX, infoY + 15)
        .text("Date Issued:", rightColX, infoY + 30);

    const formattedDate =
        order._id && typeof order._id.getTimestamp === "function"
            ? order._id
                  .getTimestamp()
                  .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
            : new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              });

    doc.fillColor(textDark)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`#${order._id}`, rightColX, infoY + 15, { align: "right", width: rightColWidth })
        .text(formattedDate, rightColX, infoY + 30, { align: "right", width: rightColWidth });

    // --- 4. TABLE HEADER ---
    const tableY = 192;
    const colItem = leftMargin;
    const colItemWidth = 240;
    const colPrice = leftMargin + 245;
    const colPriceWidth = 80;
    const colQty = leftMargin + 330;
    const colQtyWidth = 50;
    const colTotal = leftMargin + 385;
    const colTotalWidth = 110;

    // Header Fill Box
    doc.roundedRect(leftMargin, tableY, contentWidth, 24, 4).fill(primaryColor);

    doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");

    doc.text("ITEM DESCRIPTION", colItem + 10, tableY + 7, { width: colItemWidth - 10 });
    doc.text("UNIT PRICE", colPrice, tableY + 7, { width: colPriceWidth, align: "right" });
    doc.text("QTY", colQty, tableY + 7, { width: colQtyWidth, align: "center" });
    doc.text("AMOUNT", colTotal, tableY + 7, { width: colTotalWidth - 10, align: "right" });

    // --- 5. TABLE ROWS ---
    let currentY = tableY + 28;
    let totalPrice = 0;

    order.products.forEach((prod, index) => {
        const prodTitle = prod.product.title || "Product";
        const unitPrice = Number(prod.product.price) || 0;
        const quantity = Number(prod.quantity) || 1;
        const lineTotal = unitPrice * quantity;
        totalPrice += lineTotal;

        // Auto Page Break if exceeding page limits
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }

        // Alternating row background
        if (index % 2 === 0) {
            doc.roundedRect(leftMargin, currentY - 4, contentWidth, 22, 2).fill(bgLight);
        }

        doc.fillColor(textDark).fontSize(9).font("Helvetica");

        doc.text(prodTitle, colItem + 10, currentY, { width: colItemWidth - 10, lineBreak: false });
        doc.text(`$${unitPrice.toFixed(2)}`, colPrice, currentY, {
            width: colPriceWidth,
            align: "right",
        });
        doc.text(`${quantity}`, colQty, currentY, { width: colQtyWidth, align: "center" });
        doc.fillColor(primaryColor)
            .font("Helvetica-Bold")
            .text(`$${lineTotal.toFixed(2)}`, colTotal, currentY, {
                width: colTotalWidth - 10,
                align: "right",
            });

        currentY += 24;

        // Row Separator Line
        doc.moveTo(leftMargin, currentY - 6)
            .lineTo(rightMargin, currentY - 6)
            .strokeColor(borderColor)
            .lineWidth(0.5)
            .stroke();
    });

    // --- 6. SUMMARY BREAKDOWN CARD ---
    let summaryY = Math.max(currentY + 15, 320);
    if (summaryY > 660) {
        doc.addPage();
        summaryY = 50;
    }

    const summaryBoxX = 330;
    const summaryBoxWidth = rightMargin - summaryBoxX;

    doc.fillColor(textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text("Subtotal:", summaryBoxX, summaryY)
        .text(`$${totalPrice.toFixed(2)}`, summaryBoxX, summaryY, {
            align: "right",
            width: summaryBoxWidth,
        });

    doc.text("Tax (0%):", summaryBoxX, summaryY + 16).text("$0.00", summaryBoxX, summaryY + 16, {
        align: "right",
        width: summaryBoxWidth,
    });

    doc.text("Shipping:", summaryBoxX, summaryY + 32).text("FREE", summaryBoxX, summaryY + 32, {
        align: "right",
        width: summaryBoxWidth,
    });

    // Grand Total Badge Box
    doc.roundedRect(summaryBoxX, summaryY + 52, summaryBoxWidth, 34, 6).fill(primaryColor);

    doc.fillColor("#FFFFFF")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("TOTAL PAID", summaryBoxX + 12, summaryY + 64);

    doc.fillColor("#60A5FA")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`$${totalPrice.toFixed(2)}`, summaryBoxX, summaryY + 62, {
            align: "right",
            width: summaryBoxWidth - 12,
        });

    // --- 7. FOOTER & PAGE NUMBERING ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        // Footer Border Line
        doc.moveTo(leftMargin, 770)
            .lineTo(rightMargin, 770)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        doc.fillColor(textMuted)
            .fontSize(8)
            .font("Helvetica")
            .text(
                "Thank you for shopping with Toba Shop! For questions, please email support@Tobashop.com",
                leftMargin,
                780,
                { width: 350 },
            );

        doc.text(`Page ${i + 1} of ${pages.count}`, leftMargin, 780, {
            align: "right",
            width: contentWidth,
        });
    }
};

export const getIndex = catchAsync(async (req, res, next) => {
    const page = Math.max(1, +req.query.page || 1);
    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    res.status(200).render("shop/index", {
        prods: products,
        totalProducts,
        ITEM_PER_PAGE,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalProducts,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProducts / ITEM_PER_PAGE) || 1,
        totalPages: Math.ceil(totalProducts / ITEM_PER_PAGE) || 1,
    });
});

export const getProducts = catchAsync(async (req, res, next) => {
    const page = Math.max(1, +req.query.page || 1);
    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    res.status(200).render("shop/product-list", {
        prods: products,
        totalProducts,
        ITEM_PER_PAGE,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalProducts,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProducts / ITEM_PER_PAGE) || 1,
        totalPages: Math.ceil(totalProducts / ITEM_PER_PAGE) || 1,
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

export const getCheckout = catchAsync(async (req, res, next) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items;
    const totalSum = products.reduce((total, item) => {
        return total + item.quantity * item.productId.price;
    }, 0);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: products.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.productId.title,
                        description: item.productId.description,
                    },
                    unit_amount: Math.round(item.productId.price * 100),
                },
                quantity: item.quantity,
            };
        }),
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
    });

    res.status(200).render("shop/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
        products,
        totalSum,
        clientSecret: session.client_secret,
        sessionId: session.id,
    });
});

export const getCheckoutSuccess = catchAsync(async (req, res, next) => {
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
    res.redirect("/orders");
});
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

export const getInvoice = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order || order.user.userId.toString() !== req.user._id.toString()) {
        return next(new AppError(404, "Order not found"));
    }

    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicesDir = path.join("data", "invoices");
    const invoicePath = path.join(invoicesDir, invoiceName);

    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);

    doc.pipe(fs.createWriteStream(invoicePath));
    doc.pipe(res);

    generateEnterpriseInvoice(doc, order);

    doc.end();
});
