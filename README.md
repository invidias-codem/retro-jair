# retro-jair

# Retro Portfolio Website

A retro-themed portfolio website built with React and Firebase, featuring a dynamic contact form, interactive UI elements, and a unique skill showcase game.

## 🌟 Features

- **Retro Design**: Unique aesthetics with CRT screen effects and retro animations
- **Interactive Menu**: Dynamic navigation with animated icons
- **Project Showcase**: Expandable project cards with detailed information
- **Skill Game**: Interactive game interface showcasing technical skills
- **Contact Form**: Firebase-powered contact system with email notifications
- **Mobile Responsive**: Fully responsive design with mobile-specific interactions

## 🚀 Technologies

- React 
- Firebase (Firestore, Functions, Hosting)
- React Router DOM
- FontAwesome Icons
- CSS3 Animations
- Nodemailer (for email notifications)

## 📋 Prerequisites

- Node.js 18 or higher
- npm
- Firebase CLI
- Git

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/retro-portfolio.git
cd retro-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore, Functions, and Storage
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login to Firebase: `firebase login`
   - Initialize Firebase: `firebase init`

4. Create a `.env` file in the root directory:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

5. Install Functions dependencies:
```bash
cd functions
npm install
cd ..
```

## 🎮 Development

Start the development server:
```bash
npm start
```

Run Firebase emulators:
```bash
firebase emulators:start
```

## 🏗️ Building and Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## 📁 Project Structure

```
retro-portfolio/
├── src/
│   ├── components/
│   │   ├── AboutMe/
│   │   ├── ContactMe/
│   │   ├── Main/
│   │   ├── Projects/
│   │   └── Skills/
│   ├── firebase.js
│   └── App.js
├── functions/
├── public/
├── firebase.json
├── firestore.rules
├── storage.rules
└── package.json
```

## 🎯 Features Explanation

### Contact Form
- Firebase Firestore integration
- Email notifications via Cloud Functions
- Rate limiting and spam protection
- Form validation

### Skills Game
- Interactive skill demonstration
- Real-time scoring system
- Mobile-friendly controls
- Retro gaming aesthetics

### Project Showcase
- Expandable project cards
- GitHub integration
- Dynamic content loading
- Animated transitions

## 🔒 Security

- Firebase Security Rules implementation
- Rate limiting on contact form
- Protected API endpoints
- Secure file upload restrictions

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interactions
- Responsive navigation menu
- Adaptive layouts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## ✍️ Author

**Joshua Mohammed**
- GitHub: [@invidias-codem](https://github.com/invidias-codem)
- LinkedIn: [joshua-mohammed14](https://www.linkedin.com/in/joshua-mohammed14/)

## 🙏 Acknowledgments

- Inspiration from retro gaming and vintage computer interfaces
- Firebase documentation and community
- React community and contributors
- All open-source libraries used in this project

## 🐛 Known Issues

Please report any bugs or issues in the GitHub Issues section.
