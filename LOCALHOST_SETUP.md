# Localhost Development Setup Guide

This guide will help you set up and run Ahal Clips on `http://localhost:3000`.

## ✅ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   - The `.env.local` file is already configured for localhost
   - All required variables are set with default values
   - Make sure `.env.local` exists in the project root

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser and navigate to: `http://localhost:3000`
   - The app will automatically reload when you make changes

## 📋 Available Endpoints

Once the server is running, all endpoints are accessible at `http://localhost:3000`:

### Main Application
- **Home Page**: `http://localhost:3000/`
- **Version Endpoint**: `http://localhost:3000/api/version`

### API Routes
- **Auth Exchange**: `POST http://localhost:3000/api/auth/exchange`
- **Drive List**: `POST http://localhost:3000/api/drive/list`
- **Drive Upload**: `POST http://localhost:3000/api/drive/upload`
- **Drive Download**: `GET http://localhost:3000/api/drive/download?fileId=...`
- **Drive Stream**: `GET http://localhost:3000/api/drive/stream?fileId=...`
- **Drive Fetch Video**: `GET http://localhost:3000/api/drive/fetch-video?fileId=...`
- **Drive Delete**: `POST http://localhost:3000/api/drive/delete`
- **Drive Move**: `POST http://localhost:3000/api/drive/move`
- **Drive Rename**: `POST http://localhost:3000/api/drive/rename`
- **Drive Create Folder**: `POST http://localhost:3000/api/drive/create-folder`
- **Drive Save Metadata**: `POST http://localhost:3000/api/drive/save-metadata`
- **Drive Load Metadata**: `POST http://localhost:3000/api/drive/load-metadata`
- **Transcribe**: `POST http://localhost:3000/api/transcribe`
- **Save Transcript**: `POST http://localhost:3000/api/transcripts/save`

## 🔧 Environment Variables

The `.env.local` file contains:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GEMINI_API_KEY=AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🔐 Google OAuth Setup for Localhost

To use Google Drive features, you need to configure OAuth redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=video-service-479002)
2. Find your OAuth 2.0 Client ID: `188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m`
3. Click **Edit**
4. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/exchange
   http://localhost:3000
   ```
5. Click **Save**

**Important Notes:**
- Use `http://` (not `https://`) for localhost
- No trailing slashes
- Must match exactly: `http://localhost:3000/api/auth/exchange`

## 🗄️ Database Setup (Optional)

If you're using Prisma/Supabase:

1. Set up a local PostgreSQL database or use a cloud service
2. Update `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/ahal_clips?schema=public
   ```
3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

## 🧪 Testing the Setup

### Test Version Endpoint
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/version | Select-Object -ExpandProperty Content

# Or open in browser
http://localhost:3000/api/version
```

Expected response:
```json
{
  "name": "ahal-clips",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "nodeVersion": "v20.x.x"
}
```

### Test Main Application
1. Start the dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. You should see the Ahal Clips interface

## 🐛 Troubleshooting

### Port 3000 Already in Use
If port 3000 is already in use:
```bash
# Find what's using port 3000 (PowerShell)
Get-NetTCPConnection -LocalPort 3000

# Or use a different port
npm run dev -- -p 3001
```

### Environment Variables Not Loading
- Make sure `.env.local` is in the project root (same level as `package.json`)
- Restart the dev server after changing `.env.local`
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### Google OAuth Not Working
- Verify redirect URI is added in Google Cloud Console
- Check that `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`
- Clear browser cookies and try again
- Check browser console for errors

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check Prisma schema is up to date: `npx prisma generate`

## 📝 Development Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3000
- `npm run lint` - Run ESLint

## 🔄 Hot Reload

Next.js automatically reloads when you:
- Save changes to `.tsx`, `.ts`, `.js`, `.jsx` files
- Modify files in the `src/` directory
- Update API routes

No need to manually restart the server!

## ✅ Verification Checklist

- [ ] `.env.local` file exists with all required variables
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:3000` loads in browser
- [ ] `http://localhost:3000/api/version` returns version info
- [ ] Google OAuth redirect URI configured for localhost
- [ ] Database connection working (if using Prisma)

## 🚀 Next Steps

Once everything is working on localhost:
1. Test all features (recording, uploading, transcription)
2. Verify Google Drive integration
3. Check all API endpoints are responding
4. Ready for development!

---

**Note:** The `.env.local` file is gitignored and won't be committed to version control. This keeps your local configuration separate from production settings.




