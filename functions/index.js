// Firebase Functions
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
admin.initializeApp();

// Security & Utility Modules
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: [/localhost:3000$/, /retro-jair\.web\.app$/] });
const { body, validationResult } = require("express-validator");
const JSDOM = require("jsdom").JSDOM;
const DOMPurify = require("dompurify");
// 1. Import the rate-limit middleware
const rateLimit = require("express-rate-limit");

// --- Define Secrets ---
const gmailEmail = defineString("GMAIL_EMAIL");
const gmailPassword = defineString("GMAIL_PASSWORD");

// 2. Configure the rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// --- Contact Form Function with Security Enhancements ---
exports.submitContactForm = onRequest(
  { secrets: ["GMAIL_PASSWORD"], cpu: 1 },
  // 3. Apply the middlewares in a chain
  [
    cors, // First, handle CORS
    limiter, // Then, apply rate limiting
    // Then, run validation
    body("name").trim().notEmpty().escape().withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required."),
    body("subject").trim().notEmpty().escape().withMessage("Subject is required."),
    body("message").trim().notEmpty().escape().withMessage("Message is required."),
    body("reason").isIn(["General Inquiry", "Hiring", "Consultation Request"]).withMessage("Invalid reason."),
  ],
  async (request, response) => {
    // Note: The main function logic is now inside an async function
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      logger.warn("Validation error:", errors.array());
      return response.status(400).json({ errors: errors.array() });
    }

    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const sanitizedData = {
      name: purify.sanitize(request.body.data.name),
      email: purify.sanitize(request.body.data.email),
      reason: purify.sanitize(request.body.data.reason),
      subject: purify.sanitize(request.body.data.subject),
      message: purify.sanitize(request.body.data.message),
    };

    const mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    try {
      await admin.firestore().collection("contacts").add({ ...sanitizedData, timestamp: admin.firestore.FieldValue.serverTimestamp() });

      const mailOptions = {
        from: `"${sanitizedData.name}" <${sanitizedData.email}>`,
        to: gmailEmail.value(),
        subject: `New Inquiry: ${sanitizedData.subject}`,
        html: `<p>New message from portfolio site.</p><p><strong>Name:</strong> ${sanitizedData.name}</p><p><strong>Email:</strong> ${sanitizedData.email}</p><p><strong>Reason:</strong> ${sanitizedData.reason}</p><p><strong>Message:</strong></p><p>${sanitizedData.message}</p>`,
      };

      await mailTransport.sendMail(mailOptions);
      response.status(200).send({ data: { success: true, message: "Inquiry submitted successfully!" } });
    } catch (error) {
      logger.error("An error occurred:", error);
      response.status(500).send({ error: { message: "An internal error occurred." } });
    }
  }
);