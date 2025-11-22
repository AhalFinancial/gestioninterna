# Vercel Deployment Quick Checklist

Use this checklist as you deploy your project to Vercel.

## Before You Start

- [ ] Have Vercel account (or create one)
- [ ] Code is pushed to GitHub (`AhalFinancial/gestioninterna`)
- [ ] Have all credentials ready

---

## Step 1: Create Project ✅

- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Sign in with GitHub
- [ ] Import repository: `AhalFinancial/gestioninterna`
- [ ] Click **Import**

---

## Step 2: Configure Project ✅

- [ ] Framework: **Next.js** (auto-detected)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: Leave default or `prisma generate && next build`
- [ ] Install Command: `npm install` (default)

---

## Step 3: Environment Variables ✅

Add these BEFORE deploying:

### Required Variables:

- [ ] **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
  - Value: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] **GOOGLE_CLIENT_SECRET**
  - Value: `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`
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] **GEMINI_API_KEY**
  - Value: `AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c`
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] **DATABASE_URL**
  - Value: *(Set up database first - Step 4)*
  - Environments: ✅ Production ✅ Preview ✅ Development

- [ ] **NEXT_PUBLIC_APP_URL**
  - Value: *(Leave empty - update after deployment)*
  - Environments: ✅ Production ✅ Preview ✅ Development

---

## Step 4: Set Up Database ✅

Choose one:

### Option A: Vercel Postgres

- [ ] Go to **Storage** tab in project
- [ ] Click **Create Database** → **Postgres**
- [ ] Name it (e.g., `ahal-clips-db`)
- [ ] Select region
- [ ] Click **Create**
- [ ] ✅ `DATABASE_URL` is automatically added

### Option B: External Database (Neon/Supabase/Railway)

- [ ] Create account on service
- [ ] Create PostgreSQL database
- [ ] Copy connection string
- [ ] Add `DATABASE_URL` in Vercel environment variables
- [ ] Run migrations: `npx prisma migrate deploy`

---

## Step 5: Deploy ✅

- [ ] Review all settings
- [ ] Verify all environment variables are set
- [ ] Click **Deploy**
- [ ] Wait for build (2-5 minutes)
- [ ] ✅ Build succeeded!
- [ ] 📋 Copy deployment URL: `https://your-project.vercel.app`

---

## Step 6: Update Environment Variables ✅

- [ ] Go to **Settings** → **Environment Variables**
- [ ] Find `NEXT_PUBLIC_APP_URL`
- [ ] Edit with your deployment URL: `https://your-project.vercel.app`
- [ ] Save
- [ ] Go to **Deployments** tab
- [ ] Click **Redeploy** on latest deployment

---

## Step 7: Configure Google OAuth ✅

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
- [ ] Project: **video-service-479002**
- [ ] Find OAuth Client: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`
- [ ] Click to edit
- [ ] Add **Authorized redirect URIs**:
  - [ ] `https://your-project.vercel.app/api/auth/exchange`
  - [ ] `https://your-project.vercel.app`
- [ ] Click **Save**

---

## Step 8: Verify Deployment ✅

- [ ] Visit your deployment URL
- [ ] Page loads correctly
- [ ] Test Google OAuth login
- [ ] Test video recording (if applicable)
- [ ] Check browser console for errors

---

## Troubleshooting

### Build Fails ❌

- [ ] Check build logs in Vercel dashboard
- [ ] Verify all environment variables are set
- [ ] Ensure `DATABASE_URL` is correct
- [ ] Check Prisma schema is valid

### OAuth Doesn't Work ❌

- [ ] Verify `NEXT_PUBLIC_APP_URL` matches deployment URL exactly
- [ ] Check redirect URIs in Google Cloud Console match
- [ ] Ensure no trailing slashes in URLs
- [ ] Check browser console for errors

### Database Connection Fails ❌

- [ ] Verify `DATABASE_URL` format is correct
- [ ] Check database is accessible from internet
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Check database logs

---

## Your Credentials

**Quick Reference:**

- Client ID: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
- Client Secret: `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`
- Gemini API: `AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c`
- Google Project: `video-service-479002`
- GitHub Repo: `AhalFinancial/gestioninterna`

---

## Need Help?

📚 Full guide: See `VERCEL_SETUP_GUIDE.md`  
📖 Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

✅ **All done? Your app should be live at: `https://your-project.vercel.app`** 🚀

