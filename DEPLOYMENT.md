# 🚀 Quick Deployment Guide

Your **Phantom Trace** project is ready to deploy! Choose any option below:

---

## ⚡ Option 1: Vercel (Recommended - 2 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repo or drag & drop the project folder
4. Vercel auto-detects settings - just click **"Deploy"**
5. Add environment variable: `GEMINI_API_KEY` in project settings

**Your link will be:** `https://phantom-trace.vercel.app`

---

## 🎯 Option 2: Netlify (Easiest - Drag & Drop)

1. Go to [netlify.com](https://netlify.com)
2. Drag the entire project folder to **"Drop site folder here"**
3. Or connect GitHub and click **"New site from Git"**
4. Add environment variable: `GEMINI_API_KEY` in Site settings → Build & deploy → Environment

**Your link will be:** `https://phantom-trace.netlify.app`

---

## 🌐 Option 3: Render (Full-stack friendly)

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` - click **"Create Web Service"**
5. Add environment variable: `GEMINI_API_KEY` in Environment tab

**Your link will be:** `https://phantom-trace.onrender.com`

---

## 🔑 Important: Set Environment Variables

After deployment, add these in your platform's dashboard:

```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

---

## 📦 Manual Deploy (Any Platform)

If you want to deploy manually:

```bash
npm install
npm run build
npm start
```

The built files are in `dist/` folder and server starts on the port specified by the platform.

---

## ✅ After Deployment

1. Your app will be live at the provided URL
2. Share the link with anyone
3. The app is fully functional with all features

**Need help?** All platforms have free tiers and excellent documentation.
