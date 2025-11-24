# Google Drive Connection - Quick Fix Checklist

## Most Common Issues (Check These First!)

### ✅ Issue 1: `NEXT_PUBLIC_APP_URL` Not Set or Wrong

**Check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_APP_URL` is set
3. **MUST** be your actual Vercel URL (e.g., `https://gestioninterna.vercel.app`)
4. **NOT** `http://localhost:3000`

**Fix:**
- Add/Update: `NEXT_PUBLIC_APP_URL` = `https://your-actual-vercel-url.vercel.app`
- Redeploy your project

---

### ✅ Issue 2: OAuth Redirect URIs Not Configured

**Check:**
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Find OAuth Client: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`
3. Click **Edit**
4. Check **Authorized redirect URIs**

**Fix:**
Add these EXACT URIs (replace with your actual Vercel URL):
```
https://your-app.vercel.app/api/auth/exchange
https://your-app.vercel.app
```

**Important:**
- No trailing slashes
- Must be `https://` not `http://`
- Must match your Vercel URL exactly

---

### ✅ Issue 3: Environment Variables Not Loaded

**Check:**
After setting environment variables in Vercel, you MUST redeploy.

**Fix:**
1. Go to Deployments tab
2. Click **Redeploy** on latest deployment
3. Or push a new commit

---

## Quick Verification Steps

### Step 1: Check Environment Variables

**In Vercel:**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID = 188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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
NEXT_PUBLIC_APP_URL = https://your-actual-vercel-url.vercel.app
```

**Verify:**
- [ ] All three are set
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual deployment URL
- [ ] All are enabled for Production environment

### Step 2: Check Google Cloud Console

**OAuth Client ID:** `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`

**Authorized redirect URIs must include:**
- [ ] `https://your-app.vercel.app/api/auth/exchange`
- [ ] `https://your-app.vercel.app`

**Authorized JavaScript origins must include:**
- [ ] `https://your-app.vercel.app`

### Step 3: Test the Connection

1. **Visit your app:** `https://your-app.vercel.app`
2. **Click "Connect Drive"**
3. **Check:**
   - Does it redirect to Google?
   - After authorizing, does it redirect back?
   - Any errors in browser console?

---

## Debugging Tips

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try connecting to Drive
4. Look for errors like:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID is undefined`
   - `redirect_uri_mismatch`
   - Network errors

### Check Vercel Logs

1. Go to Deployments tab
2. Click on latest deployment
3. View Function Logs
4. Look for errors in `/api/auth/exchange`

### Test OAuth URL Manually

Replace placeholders with your actual values:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com
  &redirect_uri=https://your-app.vercel.app/api/auth/exchange
  &response_type=code
  &scope=https://www.googleapis.com/auth/drive.file
  &access_type=offline
  &prompt=consent
```

---

## Common Error Messages

### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI in Google Cloud Console doesn't match your app URL  
**Fix:** Update authorized redirect URIs in Google Cloud Console

### Error: "invalid_client"
**Cause:** Client ID or Secret is wrong  
**Fix:** Verify environment variables match Google Cloud Console

### Error: "Not authenticated"
**Cause:** OAuth flow didn't complete or tokens expired  
**Fix:** Try connecting again, check if cookies are set

### Error: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is undefined
**Cause:** Environment variable not set or not loaded  
**Fix:** Set in Vercel and redeploy

---

## Still Not Working?

Tell me:
1. What happens when you click "Connect Drive"?
2. Any error messages (browser console or Vercel logs)?
3. Does it redirect to Google?
4. What's your actual Vercel deployment URL?
5. Are environment variables set in Vercel?


