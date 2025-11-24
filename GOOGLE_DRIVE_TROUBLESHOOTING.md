# Google Drive Connection Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Not authenticated" Error

**Symptoms:**
- Button says "Connect Drive" but clicking doesn't work
- API returns 401 "Not authenticated" error
- OAuth redirect fails

**Checklist:**

1. **Environment Variables in Vercel**
   - ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
   - ✅ `GOOGLE_CLIENT_SECRET` is set
   - ✅ `NEXT_PUBLIC_APP_URL` matches your Vercel deployment URL exactly

2. **Google Cloud Console OAuth Settings**
   - ✅ Authorized JavaScript origins include your Vercel URL
   - ✅ Authorized redirect URIs include:
     - `https://your-app.vercel.app/api/auth/exchange`
     - `https://your-app.vercel.app`

3. **Verify Environment Variables**
   ```bash
   # Check if variables are accessible
   console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
   console.log(process.env.NEXT_PUBLIC_APP_URL);
   ```

---

### Issue 2: OAuth Redirect URI Mismatch

**Error Message:** `redirect_uri_mismatch`

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Find your OAuth 2.0 Client ID: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`
3. Click **Edit**
4. Under **Authorized redirect URIs**, add:
   - `https://your-actual-vercel-url.vercel.app/api/auth/exchange`
   - `https://your-actual-vercel-url.vercel.app`
5. **Important:** The URL must match EXACTLY (no trailing slash, correct domain)
6. Click **Save**
7. Wait a few minutes for changes to propagate

---

### Issue 3: Environment Variables Not Loaded

**Symptoms:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is `undefined`
- OAuth URL doesn't work

**Solution:**

1. **Check Vercel Environment Variables:**
   - Go to your project → Settings → Environment Variables
   - Verify all variables are set for the correct environment:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (if testing locally)

2. **Redeploy After Adding Variables:**
   - Environment variables are only loaded at build time
   - After adding/updating variables, you MUST redeploy

3. **Verify Variable Names:**
   - Must be exactly: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (with NEXT_PUBLIC_ prefix)
   - Must be exactly: `GOOGLE_CLIENT_SECRET`
   - Must be exactly: `NEXT_PUBLIC_APP_URL`

---

### Issue 4: Cookies Not Working (Vercel Edge/Serverless)

**Symptoms:**
- Authentication seems to work but doesn't persist
- Need to re-authenticate on every request

**Check:**

1. **Cookie Settings in `/api/auth/exchange/route.ts`:**
   ```typescript
   secure: process.env.NODE_ENV === "production", // Should be true in production
   sameSite: "lax", // Add this for better compatibility
   ```

2. **Domain Issues:**
   - Cookies set on `vercel.app` should work
   - If using custom domain, ensure domain is correct

---

### Issue 5: OAuth Consent Screen Not Configured

**Error:** "OAuth consent screen is not configured"

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent?project=video-service-479002)
2. Configure OAuth consent screen:
   - Choose **External** (unless you have Google Workspace)
   - Fill in required fields (App name, Support email, etc.)
   - Add scopes: `https://www.googleapis.com/auth/drive.file`
   - Add test users if app is in testing mode
3. Submit for verification if needed

---

### Issue 6: Scope Issues

**Error:** "Insufficient permissions" or "Access denied"

**Solution:**

1. **Current Scope:** `https://www.googleapis.com/auth/drive.file`
   - This only allows access to files created by the app

2. **If you need broader access:**
   - Change to: `https://www.googleapis.com/auth/drive`
   - But requires app verification for public use

3. **Update in `src/app/page.tsx`:**
   ```typescript
   const scope = "https://www.googleapis.com/auth/drive.file";
   // or
   const scope = "https://www.googleapis.com/auth/drive";
   ```

4. **Update Google Cloud Console:**
   - Go to OAuth consent screen
   - Add the scope to authorized scopes

---

## Step-by-Step Debugging

### 1. Check Environment Variables

**In Vercel:**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Verify all are set:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (should be your Vercel URL)

**Verify they're loaded:**
- Add temporary console.log in your code
- Check Vercel function logs

### 2. Check OAuth Configuration

**Your Credentials:**
- Client ID: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com`
- Client Secret: `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`
- Project: `video-service-479002`

**In Google Cloud Console:**
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Verify:
   - ✅ Authorized JavaScript origins include your Vercel URL
   - ✅ Authorized redirect URIs include:
     - `https://your-app.vercel.app/api/auth/exchange`
     - `https://your-app.vercel.app`

### 3. Test OAuth Flow Manually

1. Visit your app
2. Click "Connect Drive"
3. Should redirect to Google
4. After authorizing, should redirect back to your app
5. Check browser console for errors
6. Check Vercel function logs

### 4. Check API Endpoints

Test the API directly:

```bash
# Test auth exchange
curl -X POST https://your-app.vercel.app/api/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'

# Test drive list (should return 401 if not authenticated)
curl -X POST https://your-app.vercel.app/api/drive/list \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Quick Fixes

### Fix 1: Update Redirect URIs

1. Get your Vercel deployment URL
2. Go to Google Cloud Console → Credentials
3. Edit OAuth 2.0 Client ID
4. Add redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/exchange
   https://your-app.vercel.app
   ```
5. Save
6. Update `NEXT_PUBLIC_APP_URL` in Vercel
7. Redeploy

### Fix 2: Add Better Error Logging

Update `/api/auth/exchange/route.ts`:

```typescript
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      console.error("No code provided");
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }
    
    console.log("Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received successfully");
    
    // ... rest of code
  } catch (error: any) {
    console.error("Auth error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    return NextResponse.json({ 
      error: "Authentication failed",
      details: error.message 
    }, { status: 500 });
  }
}
```

---

## Testing Checklist

- [ ] Environment variables are set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches actual Vercel URL
- [ ] OAuth redirect URIs are configured correctly
- [ ] OAuth consent screen is configured
- [ ] Scope is correct (`drive.file` or `drive`)
- [ ] Cookies are being set (check browser DevTools)
- [ ] No CORS errors in browser console
- [ ] No errors in Vercel function logs

---

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Go to your project → Deployments
   - Click on latest deployment
   - View Function Logs
   - Look for errors

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Test Locally:**
   - Set up environment variables locally
   - Run `npm run dev`
   - Test OAuth flow locally
   - Compare with production behavior

4. **Verify API Keys:**
   - Make sure Client ID and Secret are correct
   - Check they match in Google Cloud Console

---

## Need More Help?

- Check Vercel logs for specific error messages
- Check browser console for client-side errors
- Verify environment variables are actually loaded
- Test OAuth flow step by step
- Ensure Google Cloud Console settings are correct



