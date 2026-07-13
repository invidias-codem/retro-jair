# JJ Mohammed — Portfolio

A modern professional portfolio for **Joshua-Jair “JJ” Mohammed** — DevSecOps & AI Infrastructure Engineer and founder of **Lattice OS**.

Built as a React single-page app (Create React App) with a hybrid visual language: a clean, professional base with a subtle retro accent, and a live AI-agent demo embedded on the home page.

## ✨ Highlights

- **Hero with a live agent** — the Lattice OS agent (`tech-genie`) is embedded directly on the home page so visitors can talk to it immediately.
- **Professional narrative** — About, Projects, Skills, and Contact rewritten around real work: sovereign AI infrastructure, Zero-Trust security, and full-stack product engineering.
- **Trimmed, focused structure** — Home, About, Projects, Skills, Contact, plus the Chat agent.
- **Form-only contact** — a Firebase-backed contact form; no personal email/phone/address published on the site. Direct links to LinkedIn and GitHub.
- **Responsive** — mobile-first layouts across every section.

## 🧱 Tech

- React 18 + React Router
- Tailwind CSS (chat UI) + custom design tokens (`src/theme.css`, `src/sections.css`)
- Firebase Hosting, Cloud Functions (`functions/`), Cloud Firestore
- FontAwesome + lucide-react icons

## 🚀 Local development

```bash
npm install
npm start          # dev server at http://localhost:3000
```

## 📦 Build & deploy (Firebase Hosting)

```bash
npm run build                 # outputs to /build
firebase deploy --only hosting
```

`firebase.json` is already configured: `hosting.public = "build"`, SPA rewrite to `index.html`, site `retro-jair`.

## 🔒 Notes

- `src/_archive/` holds the original retro “skills game” UI, kept for reference but no longer wired into the app.
- Contact form submissions are handled by a Firebase Cloud Function (`submitContactForm`). Local development of the form requires Firebase config in `src/firebase.js`.
- No PII (address, phone, personal email) is rendered on the public site.

## 👤 Author

**Joshua-Jair “JJ” Mohammed**
- GitHub: [@invidias-codem](https://github.com/invidias-codem)
- LinkedIn: [joshua-mohammed14](https://www.linkedin.com/in/joshua-mohammed14/)
- Founder: [Lattice OS](https://gen1e.xyz)

## 📄 License

MIT — see [LICENSE](LICENSE).
