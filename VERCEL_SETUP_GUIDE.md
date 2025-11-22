# Step-by-Step Vercel Deployment Guide

Complete guide to deploy Ahal Clips to Vercel from scratch.

## Prerequisites

✅ Your code is on GitHub: `AhalFinancial/gestioninterna`  
✅ You have a Vercel account (create one at [vercel.com](https://vercel.com) if needed)  
✅ You have your credentials ready (Google OAuth, Gemini API, etc.)

---

## Step 1: Create New Project on Vercel

### 1.1 Go to Vercel Dashboard
1. Open your browser and go to [vercel.com](https://vercel.com)
2. Click **Sign In** (or **Sign Up** if you don't have an account)
3. Sign in with GitHub (recommended) or email

### 1.2 Start New Project
1. Once logged in, click the **+ New Project** button (top right)
2. Or go directly to: [vercel.com/new](https://vercel.com/new)

### 1.3 Import Git Repository
1. You'll see a list of your GitHub repositories
2. If you don't see `AhalFinancial/gestioninterna`:
   - Click **Adjust GitHub App Permissions**
   - Make sure the `AhalFinancial` organization is authorized
   - Or import manually: Click **Import Git Repository**
   - Enter: `https://github.com/AhalFinancial/gestioninterna`
3. Click **Import** next to `AhalFinancial/gestioninterna`

---

## Step 2: Configure Project Settings

### 2.1 Project Configuration

You'll see the **Configure Project** screen:

**Framework Preset:**
- ✅ Should auto-detect: **Next.js**
- If not, select **Next.js** from the dropdown

**Root Directory:**
- Leave as **./** (default)

**Build Command:**
- Leave as default (Vercel will use `vercel-build` script)
- Or enter: `prisma generate && next build`

**Output Directory:**
- Leave empty (Next.js default)

**Install Command:**
- Leave as: `npm install`

**Node.js Version:**
- Select **20.x** (or latest LTS)

### 2.2 Environment Variables

⚠️ **IMPORTANT:** Set these before deploying!

Click **Environment Variables** section to expand it, then add each variable:

#### Add Environment Variables:

1. **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
   - Click **+ Add Another**
   - Name: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Value: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

2. **GOOGLE_CLIENT_SECRET**
   - Click **+ Add Another**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: `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`
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

3. **GEMINI_API_KEY**
   - Click **+ Add Another**
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c`
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

4. **DATABASE_URL** (You'll set this in Step 3)
   - Click **+ Add Another**
   - Name: `DATABASE_URL`
   - Value: *(Leave empty for now - we'll add it after setting up database)*
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

5. **NEXT_PUBLIC_APP_URL** (You'll update this after first deployment)
   - Click **+ Add Another**
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: *(Leave empty - we'll update it after deployment)*
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

### 2.3 Don't Deploy Yet!

⚠️ **Wait!** Don't click **Deploy** yet. We need to set up the database first.

---

## Step 3: Set Up Database

You have two options:

### Option A: Use Vercel Postgres (Easiest - Recommended)

1. **Create Database:**
   - In the Vercel dashboard, go to your project
   - Click the **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Choose a name (e.g., `ahal-clips-db`)
   - Select a region (choose closest to your users)
   - Click **Create**

2. **Copy Connection String:**
   - Once created, Vercel will automatically add `DATABASE_URL` to your environment variables
   - ✅ You're done with database setup!

3. **Run Migrations:**
   - Go back to your project settings
   - Go to **Settings** → **Environment Variables**
   - Copy the `DATABASE_URL` value
   - Run migrations locally or wait for first deployment

### Option B: Use External Database (Neon, Supabase, Railway)

1. **Create Account & Database:**
   - Go to one of these services:
     - [Neon](https://neon.tech) (Recommended - Free tier)
     - [Supabase](https://supabase.com) (Free tier)
     - [Railway](https://railway.app) (Free tier)
   - Create account and new PostgreSQL database
   - Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

2. **Add to Vercel:**
   - Go to Vercel project → **Settings** → **Environment Variables**
   - Find `DATABASE_URL`
   - Click **Edit**
   - Paste your connection string
   - Click **Save**

3. **Run Prisma Migrations:**
   ```bash
   # Set DATABASE_URL locally
   export DATABASE_URL="your-connection-string"
   
   # Run migrations
   npx prisma migrate deploy
   ```

---

## Step 4: Deploy the Project

### 4.1 Initial Deployment

1. Go back to the **Configure Project** page (or click **Deploy** button)
2. Review all settings
3. Make sure all environment variables are set
4. Click **Deploy** button (bottom right)

### 4.2 Wait for Build

- Vercel will start building your project
- You'll see build logs in real-time
- This usually takes 2-5 minutes
- ✅ Build succeeded = deployment is live!

### 4.3 Get Your Deployment URL

After successful deployment:
- You'll see: **Congratulations! Your project has been deployed**
- Your URL will be: `https://your-project-name.vercel.app`
- Or: `https://gestioninterna.vercel.app` (if using project name)

**📋 Copy this URL - you'll need it in the next step!**

---

## Step 5: Update Environment Variables

### 5.1 Update NEXT_PUBLIC_APP_URL

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Click **Edit** (or the three dots → Edit)
5. Enter your Vercel URL (e.g., `https://gestioninterna.vercel.app`)
6. Make sure ✅ Production ✅ Preview ✅ Development are selected
7. Click **Save**

### 5.2 Redeploy

After updating environment variables:
1. Go to **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**
4. Confirm: **Redeploy**

This ensures the new `NEXT_PUBLIC_APP_URL` is used.

---

## Step 6: Configure Google OAuth

### 6.1 Update OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Make sure you're in the correct project: **video-service-479002**
3. Under **OAuth 2.0 Client IDs**, find: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`
4. Click on it to edit

### 6.2 Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, add:

1. **Production URL:**
   - `https://your-project-name.vercel.app/api/auth/exchange`
   - Example: `https://gestioninterna.vercel.app/api/auth/exchange`

2. **Main URL:**
   - `https://your-project-name.vercel.app`
   - Example: `https://gestioninterna.vercel.app`

3. **Preview URLs (Optional):**
   - If you want preview deployments to work:
   - `https://*.vercel.app/api/auth/exchange` (wildcard)

4. Click **Save**

### 6.3 Update OAuth Client Settings

If you changed `NEXT_PUBLIC_APP_URL`:
- Make sure it matches in Google Cloud Console
- The redirect URI in your app should match exactly

---

## Step 7: Verify Deployment

### 7.1 Check Deployment Status

1. Go to **Deployments** tab in Vercel
2. Latest deployment should show: ✅ **Ready**
3. Click the deployment to see logs

### 7.2 Test the Application

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Check that the page loads
3. Test Google OAuth login:
   - Click "Connect Drive" or login button
   - Should redirect to Google
   - After authorization, should redirect back

### 7.3 Common Issues

**❌ Build fails with Prisma error:**
- Make sure `DATABASE_URL` is set
- Check build logs for specific error
- Ensure Prisma schema is correct

**❌ OAuth doesn't work:**
- Verify `NEXT_PUBLIC_APP_URL` matches your deployment URL
- Check redirect URIs in Google Cloud Console
- Make sure URLs match exactly (no trailing slashes)

**❌ Database connection fails:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from internet
- Run `npx prisma migrate deploy` to set up schema

---

## Step 8: Set Production Branch (Optional)

### 8.1 Configure Git Integration

1. Go to **Settings** → **Git**
2. Under **Production Branch**, select: **production** (or **master**)
3. This determines which branch deploys to production

### 8.2 Automatic Deployments

- ✅ **Production:** Deploys from your production branch
- ✅ **Preview:** Every push to other branches creates preview deployments
- ✅ **Automatic:** Vercel deploys automatically on push

---

## Step 9: Monitor Your Deployment

### 9.1 View Logs

- Go to **Deployments** tab
- Click on any deployment
- Click **View Build Logs** or **View Function Logs**

### 9.2 Check Analytics

- Go to **Analytics** tab (if enabled)
- View page views, performance metrics

### 9.3 Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain name
4. Follow DNS configuration instructions

---

## Quick Checklist

Before deploying, verify:

- [ ] All environment variables are set:
  - [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GEMINI_API_KEY`
  - [ ] `DATABASE_URL` (database set up)
  - [ ] `NEXT_PUBLIC_APP_URL` (after first deployment)

- [ ] Database is created and accessible
- [ ] Google OAuth redirect URIs are configured
- [ ] Code is pushed to GitHub
- [ ] Project is connected in Vercel

After deployment:

- [ ] Build succeeded
- [ ] Deployment URL is working
- [ ] `NEXT_PUBLIC_APP_URL` updated
- [ ] OAuth redirect URIs updated
- [ ] Application tested and working

---

## Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js on Vercel:** [vercel.com/docs/frameworks/nextjs](https://vercel.com/docs/frameworks/nextjs)
- **Prisma with Vercel:** [prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## Your Credentials Summary

📋 **Keep these handy during setup:**

- **Google Client ID:** `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
- **Google Client Secret:** `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`
- **Gemini API Key:** `AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c`
- **Google Project:** `video-service-479002`
- **GitHub Repo:** `AhalFinancial/gestioninterna`

Good luck with your deployment! 🚀

