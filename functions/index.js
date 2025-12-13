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

// --- HTTPS Function: Search Proxy (Google CSE) ---
exports.search = onRequest({ secrets: ["GOOGLE_CSE_KEY", "GOOGLE_CSE_CX"], cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const q = req.query.q;
    const num = req.query.num || 5;
    const safe = req.query.safe || 'active';
    if (!q) return res.status(400).json({ error: 'Missing q' });

    const key = process.env.GOOGLE_CSE_KEY;
    const cx = process.env.GOOGLE_CSE_CX;
    if (!key || !cx) {
      return res.status(500).json({ error: 'Search not configured' });
    }

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', key);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', q);
    url.searchParams.set('num', String(num));
    url.searchParams.set('safe', safe);

    const r = await fetch(url.toString());
    const json = await r.json();
    return res.status(r.ok ? 200 : 500).json(json);
  } catch (e) {
    logger.error('Search proxy error:', e);
    return res.status(500).json({ error: 'Search failure' });
  }
});

// --- HTTPS Function: Vertex AI Vector Search (v2) ---
exports.vectorSearch = onRequest({ cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const project = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const indexId = process.env.VERTEX_INDEX_ID;
    const embedModel = process.env.VERTEX_EMBED_MODEL || 'text-embedding-004';

    const q = req.query.q;
    const topK = Number(req.query.topK ?? 5);

    if (!project || !location || !indexId) {
      return res.status(500).json({ error: 'Vector search not configured. Missing VERTEX_PROJECT_ID/GOOGLE_CLOUD_PROJECT, VERTEX_LOCATION, or VERTEX_INDEX_ID.' });
    }
    if (!q) return res.status(400).json({ error: 'Missing q' });

    // Acquire OAuth token via Application Default Credentials
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;

    // 1) Get query embedding from Vertex embeddings API
    const embedUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${embedModel}:embedContent`;
    const embedResp = await fetch(embedUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: { parts: [{ text: q }] } })
    });
    const embedJson = await embedResp.json();
    if (!embedResp.ok) {
      return res.status(500).json({ error: 'Embedding error', detail: embedJson });
    }

    const vector = embedJson?.embedding?.values || embedJson?.embeddings?.[0]?.values;
    if (!Array.isArray(vector)) {
      return res.status(500).json({ error: 'No embedding vector returned' });
    }

    // 2) Find neighbors in Vertex Vector Search v2
    const findUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/indexes/${indexId}:findNeighbors`;
    const findResp = await fetch(findUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queries: [{
          datapoint: { featureVector: vector },
          neighborCount: topK
        }]
      })
    });
    const findJson = await findResp.json();
    if (!findResp.ok) {
      return res.status(500).json({ error: 'Vector search error', detail: findJson });
    }

    const matches = (findJson.nearestNeighbors || [])[0]?.neighbors || [];
    const results = matches.map(n => ({
      id: n.datapoint?.datapointId || '',
      // The following fields depend on your index metadata schema during ingestion
      title: n.datapoint?.restricts?.find(r => r.namespace === 'title')?.allowTokens?.[0] || '',
      snippet: n.datapoint?.restricts?.find(r => r.namespace === 'snippet')?.allowTokens?.[0] || '',
      score: n.distance || n.score || 0,
      url: n.datapoint?.restricts?.find(r => r.namespace === 'url')?.allowTokens?.[0],
      metadata: n.datapoint?.restricts || {}
    }));

    return res.status(200).json({ results });
  } catch (e) {
    logger.error('Vector search proxy error:', e);
    return res.status(500).json({ error: 'Vector search failure' });
  }
});

// --- HTTPS Function: Safe Web Fetch and Extract ---
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
exports.fetch = onRequest({ cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Invalid or missing url' });
    }

    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) {
      return res.status(500).json({ error: 'Remote fetch failed' });
    }

    const html = await r.text();
    const dom = new JSDOM(html);
    const DOMPurify = createDOMPurify(dom.window);
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

    const document = new JSDOM(clean).window.document;
    const title = document.querySelector('title')?.textContent || '';
    const contentText = document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';

    return res.status(200).json({ title, contentText });
  } catch (e) {
    logger.error('Fetch proxy error:', e);
    return res.status(500).json({ error: 'Fetch failure' });
  }
});

// --- HTTPS Function: Create Google Calendar Event ---
exports.calendarCreateEvent = onRequest({ secrets: ['GOOGLE_CALENDAR_API_KEY'], cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { title, description, startTime, endTime, attendees } = req.body || {};
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields: title, startTime, endTime' });
    }

    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Calendar API not configured' });
    }

    const event = {
      summary: title,
      description: description || '',
      start: { dateTime: startTime, timeZone: 'UTC' },
      end: { dateTime: endTime, timeZone: 'UTC' },
      attendees: (attendees || []).map(email => ({ email })),
    };

    const calendarUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const response = await fetch(calendarUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'Calendar API error' });
    }

    const data = await response.json();
    return res.status(200).json({ eventId: data.id, eventUrl: data.htmlLink });
  } catch (e) {
    logger.error('Calendar event creation error:', e);
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// --- HTTPS Function: Create GitHub Issue ---
exports.githubCreateIssue = onRequest({ secrets: ['GITHUB_TOKEN'], cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { repo, title, body, labels, assignees } = req.body || {};
    if (!repo || !title) {
      return res.status(400).json({ error: 'Missing required fields: repo, title' });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'GitHub API not configured' });
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return res.status(400).json({ error: 'Invalid repo format. Use owner/repo' });
    }

    const issueData = {
      title,
      body: body || '',
      labels: labels || [],
      assignees: assignees || [],
    };

    const issueUrl = `https://api.github.com/repos/${owner}/${repoName}/issues`;
    const response = await fetch(issueUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify(issueData),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'GitHub API error' });
    }

    const data = await response.json();
    return res.status(200).json({ issueUrl: data.html_url, issueNumber: data.number });
  } catch (e) {
    logger.error('GitHub issue creation error:', e);
    return res.status(500).json({ error: 'Failed to create GitHub issue' });
  }
});

// --- HTTPS Function: Send Email ---
exports.emailSend = onRequest({ secrets: ['SENDGRID_API_KEY'], cpu: 1 }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, subject, body, cc, bcc } = req.body || {};
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        cc: (cc || []).map(email => ({ email })),
        bcc: (bcc || []).map(email => ({ email })),
      }],
      from: { email: 'noreply@retro-jair.com', name: 'Retro Jair' },
      subject,
      content: [{ type: 'text/html', value: body }],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: error || 'SendGrid API error' });
    }

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (e) {
    logger.error('Email sending error:', e);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});