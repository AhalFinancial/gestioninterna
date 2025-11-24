# Quick Setup: Vercel MCP Server in Cursor

## ✅ Package Installed
The Vercel MCP server (`@mistertk/vercel-mcp`) is installed and ready to use.

## ✅ API Key Configured
Your Vercel API key has been set up in the configuration file.

## 🚀 Add to Cursor Settings

**Option 1: Copy from Configuration File**
1. Open `.cursor-mcp-config.json` in this project
2. Copy the entire contents
3. Open Cursor Settings:
   - Press `Ctrl + Shift + P`
   - Type "Preferences: Open User Settings (JSON)"
   - Press Enter
4. Add or merge the `mcpServers` section into your settings

**Option 2: Manual Configuration**

1. Open Cursor Settings JSON:
   - Press `Ctrl + Shift + P`
   - Type "Preferences: Open User Settings (JSON)"
   - Press Enter

2. Add this configuration:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "@mistertk/vercel-mcp"
      ],
      "env": {
        "VERCEL_API_KEY": "sEqGD3UBqIvqD8pK4YYTLXWD"
      }
    }
  }
}
```

**Note:** If you already have an `mcpServers` section, just add the `"vercel"` entry to it.

## 🔄 Restart Cursor

After adding the configuration:
1. Save the settings file
2. Close Cursor completely
3. Reopen Cursor
4. The Vercel MCP server should now be available!

## ✅ Verify It's Working

1. Open a new chat in Cursor
2. You should now have access to Vercel tools like:
   - List Vercel projects
   - View deployments
   - Manage environment variables
   - And 114+ other Vercel tools!

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

The `.cursor-mcp-config.json` file has been added to `.gitignore` to protect your API key. Never commit API keys to version control!


