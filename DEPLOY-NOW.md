# 🚀 INSTANT DEPLOYMENT - Choose ONE Method

## ⚡ METHOD 1: Render (Recommended - 2 Minutes)

### Why Render?
- ✅ Free tier supports full Node.js backend
- ✅ Auto-detects `render.yaml` configuration
- ✅ Provides persistent URL
- ✅ No credit card required

### Steps:

1. **Go to Render:** https://dashboard.render.com/

2. **Click "New +" → "Web Service"**

3. **Connect Repository:**
   - Option A: Connect your GitHub account and select the repo
   - Option B: Use "Public Git repository" and paste the repo URL

4. **Render Auto-Detects Settings:**
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - All from `render.yaml` ✅

5. **Click "Create Web Service"**

6. **Wait 3-5 minutes for build**

7. **Your URL:** `https://phantom-trace-orcathon.onrender.com`

### Optional: Add Gemini API Key
- Go to "Environment" tab
- Add `GEMINI_API_KEY` variable
- App works without it (uses fallback reports)

---

## ⚡ METHOD 2: Railway (Fastest - 1 Minute)

### Steps:

1. **Go to Railway:** https://railway.app/

2. **Click "Start a New Project"**

3. **Deploy from GitHub repo** or **Empty Project**

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   ```

5. **Railway auto-builds and deploys**

6. **Get your URL from the deployment**

---

## ⚡ METHOD 3: Vercel (Most Popular)

### Steps:

1. **Go to Vercel:** https://vercel.com/new

2. **Import Git Repository**

3. **Vercel auto-detects the build:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Click "Deploy"**

5. **Your URL:** `https://phantom-trace-orcathon.vercel.app`

---

## 📦 METHOD 4: Manual ZIP Upload (No Git Required)

### For Render:

1. **Zip the entire project folder** (exclude `node_modules`)

2. **Go to:** https://dashboard.render.com/

3. **New + → Web Service → Deploy an existing image or source code**

4. **Upload ZIP file**

5. **Configure:**
   - Environment: Node
   - Build: `npm install && npm run build`
   - Start: `npm start`

6. **Deploy!**

---

## 🔑 Environment Variables (Optional)

All platforms support environment variables:

```env
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=your_key_here  # Optional - app works without it
```

**Get Gemini API Key:** https://aistudio.google.com/apikey

---

## ✅ Verify Deployment

After deployment, test these URLs:

1. **Health Check:** `https://your-url.com/api/health`
   - Should return: `{"status":"UP","platform":"PHANTOM//TRACE Deception Core"}`

2. **Dashboard API:** `https://your-url.com/api/dashboard`
   - Should return JSON with metrics

3. **Frontend:** `https://your-url.com/`
   - Should load the full application

---

## 🐛 Troubleshooting

### "Build Failed"
- Check build logs for missing dependencies
- Run `npm install && npm run build` locally first

### "Application Error"
- Check if `npm start` command is correct
- Ensure `NODE_ENV=production` is set

### "Frontend loads but API doesn't work"
- Check if backend routes are accessible: `/api/health`
- Verify CORS is configured correctly

---

## 🎯 Quick Test After Deployment

1. Open your deployed URL
2. Click "Run Scenario" button
3. Watch the 3D network visualization
4. Navigate to "Incidents & Dossiers"
5. Verify incident was created

If all steps work → **Deployment Successful!** ✅

---

## 💡 Pro Tips

1. **Render Free Tier:**
   - Spins down after 15 min inactivity
   - First request takes ~30s to wake up
   - Subsequent requests are instant

2. **Vercel:**
   - Excellent for frontend
   - May need serverless function configuration for backend

3. **Railway:**
   - $5/month free credit
   - Fastest cold start times

---

## 📞 Need Help?

1. Check platform-specific documentation
2. Review build logs in deployment dashboard
3. Test locally first: `npm run build && npm start`

---

**Current Status:** Project builds successfully ✅  
**Ready to Deploy:** YES ✅  
**Recommended:** Render (Full-stack Node.js support)
