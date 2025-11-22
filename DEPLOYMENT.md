# Vercel Deployment Guide

This guide will help you deploy Ahal Clips to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A GitHub account (your code is already on GitHub)
3. Environment variables ready (see below)

## Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project**
3. Select **Import Git Repository**
4. Choose your repository: `AhalFinancial/gestioninterna`
5. Vercel will automatically detect it's a Next.js project

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required Environment Variables

Add these exact values in your Vercel project settings:

1. **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
   - Value: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`

2. **GOOGLE_CLIENT_SECRET**
   - Value: `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`

3. **GEMINI_API_KEY**
   - Value: `AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c`

4. **NEXT_PUBLIC_APP_URL**
   - **Important:** Set this AFTER your first Vercel deployment
   - Format: `https://your-app.vercel.app` (your actual Vercel URL)
   - Initially, you can leave it blank or use a placeholder

5. **DATABASE_URL**
   - PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database?schema=public`
   - You need to set up a PostgreSQL database first (see Database Setup section below)

### How to Add Environment Variables in Vercel:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable for:
   - **Production** (and Preview/Development if needed)
4. Click **Save**

## Step 3: Configure Google OAuth Redirect URIs

**Important:** After your first Vercel deployment, you MUST update Google OAuth settings.

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Find your OAuth 2.0 Client ID: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
3. Click **Edit**
4. Add **Authorized redirect URIs**:
   - `https://your-app.vercel.app/api/auth/exchange` (replace with your actual Vercel URL)
   - `https://your-app.vercel.app` (for the main page redirect)
   - Add preview URLs if needed (e.g., `https://your-app-git-production.vercel.app`)
5. Click **Save**
6. Update `NEXT_PUBLIC_APP_URL` in Vercel with your actual deployment URL

## Step 4: Set Up Database

You need a PostgreSQL database. Recommended providers:

### Option A: Vercel Postgres (Recommended)
- Go to your Vercel project → **Storage** tab
- Create a Postgres database
- The `DATABASE_URL` will be automatically added to environment variables

### Option B: External Database Services
- **Neon** (neon.tech) - Free tier available
- **Supabase** (supabase.com) - Free tier available
- **Railway** (railway.app) - Free tier available

### Run Prisma Migrations

After setting up your database:

```bash
# Set your DATABASE_URL
export DATABASE_URL="your-connection-string"

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's build command (already configured in `package.json`).

## Step 5: Deploy

1. Push your changes to the `production` branch (or your main branch)
2. Vercel will automatically deploy
3. Or trigger a manual deployment from the Vercel dashboard

## Step 6: Update Environment Variables After First Deployment

After your first deployment:

1. Copy your Vercel deployment URL
2. Go to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
4. Update Google OAuth redirect URIs (see Step 3)
5. Redeploy your project

## Branch Deployment

- **Production Branch**: `production` (or `master`)
- **Preview Deployments**: Every push to other branches creates a preview deployment

## Troubleshooting

### Build Errors

- **Prisma errors**: Make sure `DATABASE_URL` is set correctly
- **Missing environment variables**: Check all required variables are set

### OAuth Errors

- Verify redirect URIs match your Vercel URL
- Check `NEXT_PUBLIC_APP_URL` matches your deployment URL
- Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Database Connection Errors

- Verify `DATABASE_URL` format is correct
- Check database allows connections from Vercel IPs
- Run `npx prisma migrate deploy` to ensure schema is up to date

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations have run successfully
- [ ] Google OAuth redirect URIs updated
- [ ] `NEXT_PUBLIC_APP_URL` matches deployment URL
- [ ] Test OAuth login flow
- [ ] Test video recording and upload
- [ ] Test transcription feature

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

