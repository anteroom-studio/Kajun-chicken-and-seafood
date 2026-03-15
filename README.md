# 🌶️ KAJUN CHICKEN & SEAFOOD — v2.0

> Cinematic $10K+ restaurant website. React + Vite. GitHub Pages ready.

## ⚡ Quick Start

```bash
npm install
npm run dev
# → http://localhost:5173/kajun-chicken/
```
```bash
________is the password for kajun website
https://zawwarsami16.github.io/Kajun-chicken-and-seafood
https://zawwarsami16.github.io/Kajun-chicken-and-seafood/admin
```
## 🔑 Setup Groq API Key

**Option 1 — .env file (local dev):**
```
# .env (already created)
VITE_GROQ_API_KEY=your_key_here
```

**Option 2 — In-browser:**
Menu page → Click KAJUN AI panel → ⚙️ → Paste key → Connect

**Option 3 — GitHub Secrets (production):**
GitHub repo → Settings → Secrets → `VITE_GROQ_API_KEY`

Get free key: https://console.groq.com

## 🚀 Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "🌶️ Kajun Chicken v2 launch"
git remote add origin https://github.com/YOUR_USERNAME/kajun-chicken.git
git push -u origin main
```

Then: **Settings → Pages → Source → GitHub Actions**

Live at: `https://YOUR_USERNAME.github.io/kajun-chicken/`

## 📁 Structure

```
src/
├── components/   Navbar, CartSidebar, Footer, Toast
├── context/      CartContext (global state)
├── data/         menu.js (all items + AI prompt)
├── pages/        Home, Menu, About, Locations, Receipt
├── App.jsx       Router + cursor + layout
├── main.jsx      Entry point
└── index.css     Full design system
.env              ← Paste your Groq key here
```

## 🎨 Design

- **Black** `#080808` · **Crimson** `#c8102e` · **Gold** `#d4a017`
- **Fonts:** Antonio (cinematic display) · Syne (futuristic UI) · Mulish (body)
- Custom cursor, film grain, particle canvas, floating hero image
- Scroll reveal, count-up animations, marquee ticker
- Fully responsive — mobile first
