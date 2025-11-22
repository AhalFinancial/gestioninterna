# Vercel MCP Server Setup Guide

This guide will help you configure the Vercel MCP server in Cursor.

## ✅ Installation Complete

The Vercel MCP server package (`@mistertk/vercel-mcp`) has been installed globally on your system.

## Step 1: Get Your Vercel API Key

1. Go to [Vercel Settings](https://vercel.com/account/tokens)
2. Navigate to **Tokens** section
3. Click **Create Token**
4. Give it a name (e.g., "MCP Server")
5. Select **Full Account** scope
6. Click **Create** and **copy the token** (you won't be able to see it again!)

## Step 2: Configure MCP Server in Cursor

### On Windows:

1. Open Cursor Settings:
   - Press `Ctrl + ,` (or go to **File → Preferences → Settings**)
   - Or press `Ctrl + Shift + P` and search for "Preferences: Open User Settings (JSON)"

2. Navigate to MCP Settings:
   - Look for **MCP** or **Model Context Protocol** settings
   - Or directly edit the settings file at:
     - `%APPDATA%\Cursor\User\settings.json`

3. Add the Vercel MCP server configuration:

```json
{
  "mcp": {
    "servers": {
      "vercel": {
        "command": "npx",
        "args": [
          "-y",
          "@mistertk/vercel-mcp"
        ],
        "env": {
          "VERCEL_API_KEY": "your_vercel_api_key_here"
        }
      }
    }
  }
}
```

**Your API Key is configured!** The configuration file (`.cursor-mcp-config.json`) in this project contains your API key. Copy the configuration from that file and paste it into your Cursor settings.

**Quick Copy Configuration:**
```json
{
  "mcp": {
    "servers": {
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
}
```

### Alternative Configuration (Using Environment Variable):

If you prefer to set the API key as a system environment variable:

1. Set environment variable in Windows:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to **Advanced** tab → **Environment Variables**
   - Under **User variables**, click **New**
   - Variable name: `VERCEL_API_KEY`
   - Variable value: (paste your API key)
   - Click **OK** on all dialogs

2. Then configure in Cursor settings (without the env key):

```json
{
  "mcp": {
    "servers": {
      "vercel": {
        "command": "npx",
        "args": [
          "-y",
          "@mistertk/vercel-mcp"
        ]
      }
    }
  }
}
```

## Step 3: Restart Cursor

After adding the configuration:
1. Close Cursor completely
2. Reopen Cursor
3. The Vercel MCP server should now be available

## Step 4: Verify Installation

1. Open a chat in Cursor
2. You should now have access to Vercel-related tools including:
   - Managing deployments
   - Listing projects
   - Managing domains
   - Viewing logs
   - Managing environment variables
   - And 114+ other Vercel tools!

## Troubleshooting

### Server not connecting?
- Verify your API key is correct
- Check that the MCP server is properly configured in settings
- Try restarting Cursor
- Check Cursor's output/logs for MCP errors

### API Key Issues?
- Make sure you copied the entire token (they're long!)
- Verify the token hasn't expired
- Regenerate a new token if needed

### Still having issues?
- Check the package documentation: https://github.com/MisterTK/vercel-api-mcp
- Verify the package is installed: `npm list -g @mistertk/vercel-mcp`
- Try running manually to test: `npx -y @mistertk/vercel-mcp VERCEL_API_KEY=your_key`

## Available Features

This MCP server provides comprehensive Vercel platform management:
- **114+ tools** for Vercel operations
- **4 resources** for accessing Vercel data
- **5 prompts** for common tasks
- Full support for deployments, domains, DNS, projects, teams, security, and monitoring

## Security Note

⚠️ **Important:** Never commit your Vercel API key to version control. Always use environment variables or secure configuration files that are in `.gitignore`.

