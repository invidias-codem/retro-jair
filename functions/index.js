// Firebase Functions
const { onRequest } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Firebase Admin
const admin = require("firebase-admin");
admin.initializeApp();

// Node Modules
const nodemailer = require("nodemailer");
const cors = require("cors")({
  origin: [/localhost:3000$/, /retro-jair\.web\.app$/]
});

// --- CORRECTED DEFINITIONS ---
// 1. Define the email as a parameter. It is not a secret.
const gmailEmail = defineString("GMAIL_EMAIL");
// 2. The password will ONLY be handled as a secret, so we remove its defineString line.

// --- Callable Function for Contact Form ---
// 3. Remove GMAIL_EMAIL from the secrets array. Only the password is a secret.
exports.submitContactForm = onRequest({ secrets: ["GMAIL_PASSWORD"], cpu: 1 }, (request, response) => {
  cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(405).send("Method Not Allowed");
    }

    // 4. Access the password directly from process.env, which is how secrets are exposed.
    //    Access the email parameter with .value()
    const mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const { name, email, reason, subject, message } = request.body.data;

    try {
      await admin.firestore().collection("contacts").add({ name, email, reason, subject, message, timestamp: admin.firestore.FieldValue.serverTimestamp() });

      const mailOptions = {
        from: `"${name}" <${email}>`,
        to: gmailEmail.value(),
        subject: `New Contact Form Inquiry: ${subject}`,
        html: `<p>You received a new message from your portfolio site.</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Reason:</strong> ${reason}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message}</p>`,
      };

      await mailTransport.sendMail(mailOptions);
      response.status(200).send({ data: { success: true, message: "Inquiry submitted successfully!" } });

    } catch (error) {
      logger.error("An error occurred:", error);
      response.status(500).send({ error: { message: "An internal error occurred." } });
    }
  });
});

// --- Storage Trigger Function ---
exports.logStorageEvent = onObjectFinalized({ cpu: 1 }, (event) => {
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  
  logger.log("Cloud Storage event detected!");
  logger.log(`  Event ID: ${event.id}`);
  logger.log(`  Event Type: ${event.type}`);
  logger.log(`  Bucket: ${fileBucket}`);
  logger.log(`  File: ${filePath}`);
  logger.log(`  Content Type: ${contentType}`);
  logger.log(`  Created: ${event.data.timeCreated}`);
  logger.log(`  Updated: ${event.data.updated}`);
});