import nodemailer from "nodemailer";

export default class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(" ")[0];
        this.from = "Shop";
        this.url = url;
    }

    newTransport() {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(subject, message) {
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html: message,
        };

        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send("Welcome to Shop", `<h1>Welcome ${this.firstName}</h1>`);
    }

    async sendPasswordReset() {
        await this.send(`${this.url}`);
    }
}
