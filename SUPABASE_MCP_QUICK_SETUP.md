# Quick Setup: Supabase MCP Server in Cursor

## ✅ Package Installed
The Supabase MCP server (`@supabase/mcp-server-supabase`) is installed and ready to use.

## 🚀 Add to Cursor Settings (Recommended: Hosted Server)

**Option 1: Supabase Hosted Server (Easiest - Recommended)**

1. Open Cursor Settings:
   - Press `Ctrl + Shift + P`
   - Type "Preferences: Open User Settings (JSON)"
   - Press Enter

2. Add this configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

**Benefits:**
- ✅ No API keys needed
- ✅ Automatic authentication
- ✅ Login via your Supabase account
- ✅ Easiest setup

**During Setup:**
- You'll be prompted to log in to your Supabase account
- Select the organization containing your project
- Grant access to the MCP client

---

## Option 2: Local NPM Package

If you prefer to use the local npm package, you'll need your Supabase credentials:

1. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public key** (use this one, not service_role)

2. Add to Cursor Settings:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://ydujorztkwodrsmgtcaj.supabase.co",
        "SUPABASE_KEY": "your_anon_key_here"
      }
    }
  }
}
```

**Replace:**
- `SUPABASE_URL` with your actual Supabase project URL
- `SUPABASE_KEY` with your anon public key from the dashboard

**Your Supabase Project:**
- Database Host: `db.ydujorztkwodrsmgtcaj.supabase.co`
- Check your Supabase dashboard for the exact project URL

---

## 🔄 Restart Cursor

After adding the configuration:
1. Save the settings file
2. Close Cursor completely
3. Reopen Cursor
4. The Supabase MCP server should now be available!

## ✅ Verify It's Working

1. Open a new chat in Cursor
2. You should now have access to Supabase tools like:
   - Query your database
   - Manage database schema
   - Access Supabase storage
   - Manage Supabase functions
   - And more!

## 📝 Location of Cursor Settings (Windows)

Your Cursor settings file is typically located at:
```
%APPDATA%\Cursor\User\settings.json
```

Or you can navigate to:
```
C:\Users\<YourUsername>\AppData\Roaming\Cursor\User\settings.json
```

## 🔒 Security Note

⚠️ **Important:**
- For Option 1 (hosted server): Authentication is handled automatically
- For Option 2 (local package): Never commit your Supabase keys to version control
- Use the anon key (not service_role key) for MCP client access
- The service_role key should only be used in secure server environments

## 📚 More Information

See `SUPABASE_MCP_SETUP.md` for detailed setup instructions and troubleshooting.




