# Inbox Insight AI

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://intent-aware.vercel.app/)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-blue?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)


**AI-powered Gmail dashboard for organizing, summarizing, and managing emails smarter—one-click actions, and real-time insights.**

🌐 [Live Demo »](https://intent-aware.vercel.app/)

---

## ✨ Features

- **🤖 AI Summarization** – Instant email summaries with intelligent intent detection
- **⚡ Smart Actions** – One-click star, archive, mark as read/unread, and delete
- **🎯 Priority & Intent Filters** – Quickly filter emails by AI-powered smart tags
- **🔐 Secure OAuth Login** – Google sign-in with privacy and security in mind
- **🔄 Auto-Refresh** – Emails update every 2 minutes automatically
- **🎨 Modern UI** – Responsive design with smooth animations and intuitive UX
- **📱 Cross-Platform** – Desktop optimized, mobile improving

---

## 🛠️ Tech Stack

### Frontend & Backend
- **Next.js** (App Router) - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Authentication & Database
- **NextAuth.js** (Google OAuth) - Secure authentication
- **MongoDB** - Account management and data storage

### AI & APIs
- **OpenRouter API** - AI summaries & intent classification
- **Gmail API** - Email fetching and management

### Deployment
- **Vercel** - Serverless deployment platform

---

## 📸 Screenshots

>![Landing Page](https://github.com/user-attachments/assets/c2e71787-9778-452c-a287-b13e7081549a)

> ![AI Summary Example](https://github.com/user-attachments/assets/d8ca9c9d-c1a4-44d9-a190-129a3565f219)


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with Gmail API enabled
- MongoDB database (local or cloud)
- OpenRouter API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sloppysaint/Intent-Email.git
   cd Intent-Email
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory and add:
   ```bash
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # NextAuth
   NEXTAUTH_SECRET=your-next-auth-secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Database
   MONGODB_URI=your-mongodb-connection-uri
   
   # AI API
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🎯 Intent Categories

The AI classifies emails into these categories for better organization:

- **🚨 Urgent** - Time-sensitive matters requiring immediate attention
- **📅 Meeting** - Meeting invitations, scheduling, appointments
- **❓ Request** - Asking for information, help, approval, or action
- **📢 Update** - Status updates, progress reports, announcements
- **🎯 Promotion** - Marketing emails, sales offers, advertisements
- **👤 Personal** - Personal messages, non-work related communication
- **🎉 Social** - Social invitations, community events, networking
- **📚 Info** - Educational content, newsletters, articles
- **⭐ Primary** - Important business communication, official notices
- **📁 Other** - Anything that doesn't fit other categories

---

## 📱 Status

- **Desktop UI:** ✅ Fully supported
- **Mobile UI:** 🔄 Improving, best viewed on desktop for now

---

## 🛡️ Privacy & Security

- **🔒 No email storage** - Emails are never stored on our servers
- **🖥️ Live processing** - All processing happens in your browser
- **🔐 Secure OAuth** - Google-authenticated access only
- **🚫 No tracking** - We don't track or store your personal data

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)

1. Fork this repository
2. Connect your GitHub account to [Vercel](https://vercel.com)
3. Import the project and add your environment variables
4. Deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

---

## 🤝 Contributing

This is an ongoing hobby project! We welcome contributions from the community.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Feedback

If you try the application, please [fill this feedback form]([https://forms.gle/your-feedback-form](https://docs.google.com/forms/d/e/1FAIpQLSdvmg6Bp2UBI5yCyQ3Uw9rk-SRoe7YBEqE-QL26hBWplW1dIg/viewform?usp=sharing&ouid=115444399039218477109)) and share your thoughts or ideas.

---


## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- AI powered by OpenRouter API
- Deployed on Vercel's amazing platform
- Icons and animations by Framer Motion

---


<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/sloppysaint">@sloppysaint</a></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
