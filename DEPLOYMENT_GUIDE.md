# 🚀 Lev Echad Website - Production Deployment Guide

This guide will help you deploy your Lev Echad website with Shauli chatbot to production using Vercel with secure environment variables.

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/MoshikMash/lev-echad-website.git
- ✅ OpenAI API key: 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
- ✅ Complete website with Shauli AI chatbot

## 🌐 Step-by-Step Vercel Deployment

### Step 1: Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with your GitHub account
3. This will connect Vercel to your GitHub repositories

### Step 2: Import Your Repository
1. Click "New Project" in Vercel dashboard
2. Import from GitHub: `MoshikMash/lev-echad-website`
3. Vercel will automatically detect it's a Vite React project

### Step 3: Configure Build Settings
Vercel should auto-detect these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 4: Add Environment Variables (CRITICAL!)
Before deploying, add your OpenAI API key securely:

1. In Vercel project settings, go to **Environment Variables**
2. Add new variable:
   - **Name:** `VITE_OPENAI_API_KEY`
   - **Value:** `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`
   - **Environments:** Production, Preview, Development

### Step 5: Deploy
1. Click "Deploy"
2. Vercel will build and deploy your site
3. You'll get a live URL like: `https://lev-echad-website.vercel.app`

### Step 6: Custom Domain (Optional)
1. In Vercel project settings, go to **Domains**
2. Add your custom domain (e.g., `levechadpgh.org`)
3. Follow Vercel's DNS configuration instructions

## 🔒 Security Benefits

### ✅ What This Setup Provides:
- **API key never in code** - Stored securely in Vercel environment
- **GitHub repo stays clean** - No secrets in version control
- **Automatic deployments** - Push to GitHub = automatic Vercel deploy
- **HTTPS by default** - Secure connection for all users
- **Global CDN** - Fast loading worldwide

### ✅ How Shauli Will Work:
- **Local development** - Uses `.env.local` file
- **Production** - Uses Vercel environment variables
- **Fallback system** - Works even if API key fails
- **Secure communication** - All API calls encrypted

## 🎯 Expected Results

### Your Live Website Will Have:
- ✅ **Professional URL** - Custom domain or Vercel subdomain
- ✅ **Shauli AI chatbot** - Fully functional with OpenAI integration
- ✅ **Complete information** - All 9 Get Information categories
- ✅ **Secure API handling** - No exposed secrets
- ✅ **Fast global access** - CDN-powered delivery
- ✅ **Automatic updates** - Deploy by pushing to GitHub

### Shauli's Capabilities on Production:
- ✅ **Natural conversations** - OpenAI GPT-3.5 Turbo integration
- ✅ **Pittsburgh expertise** - 15 years of local knowledge
- ✅ **Israeli humor** - Authentic personality and cultural references
- ✅ **Comprehensive help** - Schools, synagogues, neighborhoods, kosher food, healthcare
- ✅ **Personal connection** - Custom photo and backstory

## 🚀 Quick Start Commands

If you want to use Vercel CLI (optional):
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
vercel

# Add environment variable via CLI
vercel env add VITE_OPENAI_API_KEY
```

## 📞 Support

- **Vercel Documentation:** https://vercel.com/docs
- **Environment Variables Guide:** https://vercel.com/docs/environment-variables
- **Custom Domains:** https://vercel.com/docs/custom-domains

Your Lev Echad website with Shauli will be live and helping Jewish families in Pittsburgh within minutes! 🏠✡️🤖


