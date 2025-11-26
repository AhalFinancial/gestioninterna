# Supabase MCP Server Setup Guide

This guide will help you configure the Supabase MCP server in Cursor.

## ✅ Installation Complete

The Supabase MCP server package (`@supabase/mcp-server-supabase`) has been installed globally on your system.

## Option 1: Use Supabase Hosted MCP Server (Recommended - Easiest)

Supabase provides a hosted MCP server that handles authentication automatically:

### Configuration:

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
- ✅ Automatic authentication
- ✅ No API keys needed
- ✅ Login via Supabase account
- ✅ Easy setup

**During Setup:**
- You'll be prompted to log in to your Supabase account
- Select the organization containing your project
- Grant access to the MCP client

---

## Option 2: Use Local NPM Package (More Control)

If you prefer to use the local npm package, you'll need your Supabase credentials:

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (for client-side access)
   - **service_role key** (for server-side access - use with caution!)

**Your Supabase Project URL:**
Based on your database connection string:
```
Project Host: db.ydujorztkwodrsmgtcaj.supabase.co
```

You'll need to construct your Supabase URL. Check your Supabase dashboard for the exact URL.

### Step 2: Configure in Cursor

1. Open Cursor Settings JSON (as described above)

2. Add this configuration:

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
- `SUPABASE_KEY` with your anon public key (from Supabase dashboard)

---

## Step 3: Restart Cursor

After adding the configuration:
1. Save the settings file
2. Close Cursor completely
3. Reopen Cursor
4. The Supabase MCP server should now be available

## Step 4: Verify Installation

1. Open a new chat in Cursor
2. You should now have access to Supabase tools including:
   - Querying your database
   - Managing database schema
   - Accessing Supabase storage
   - Managing Supabase functions
   - And more!

## 📋 Your Current Supabase Setup

Based on your project files, you're using Supabase with:

**Database Connection:**
- Host: `db.ydujorztkwodrsmgtcaj.supabase.co`
- This is a Supabase PostgreSQL database

**Next Steps:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Find your project URL and API keys
3. Use Option 1 (hosted server) for easiest setup, or
4. Use Option 2 with your credentials for more control

## Troubleshooting

### Hosted Server (Option 1) Issues
- Make sure you're logged into the correct Supabase account
- Verify you've selected the correct organization
- Check your internet connection

### Local Package (Option 2) Issues
- Verify your SupABASE_URL is correct (should start with `https://`)
- Check that your SUPABASE_KEY is the anon public key (not service_role)
- Ensure the URL format matches: `https://xxxxx.supabase.co`

### Server not connecting?
- Check Cursor's output/logs for MCP errors
- Verify the configuration JSON is valid
- Try restarting Cursor

## Security Note

⚠️ **Important:**
- Never commit your Supabase keys to version control
- Use the anon key for MCP (not service_role key which has admin access)
- The service_role key should only be used in secure server environments

## Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Package Repository](https://github.com/supabase/mcp-server-supabase)




