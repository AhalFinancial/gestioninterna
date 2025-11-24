# PowerShell script to set up localhost development environment
# Run this script: .\setup-localhost.ps1

Write-Host "🚀 Setting up Ahal Clips for localhost:3000..." -ForegroundColor Cyan

# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    
    $envContent = @"
# Localhost Development Configuration
# This file is for local development on http://localhost:3000

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=188294285944-dltf9i5ib177kr6m4aagvv1rrqke9m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Gemini API Key for Transcription
GEMINI_API_KEY=AIzaSyBJEx_s-OdKpnH7fO3Y1_ETnTdts3WgW_c

# Application URL - Set to localhost:3000 for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database URL (if using Prisma/Supabase)
# Uncomment and set your local database URL if needed
# DATABASE_URL=postgresql://user:password@localhost:5432/ahal_clips?schema=public

# Node Environment
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath .env.local -Encoding utf8
    Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
}

# Check if node_modules exists
if (Test-Path node_modules) {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Configure Google OAuth redirect URI: http://localhost:3000/api/auth/exchange" -ForegroundColor White
Write-Host ""
Write-Host "See LOCALHOST_SETUP.md for detailed instructions" -ForegroundColor Yellow


