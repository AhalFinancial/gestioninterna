# Setup Notes - Database Configuration

## Database Connection String

Your database has been configured with Supabase:

**Connection String:**
```
postgresql://postgres:GestionInterna1486@db.ydujorztkwodrsmgtcaj.supabase.co:5432/postgres
```

## Next Steps

### 1. Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Find or add `DATABASE_URL`
4. Paste the connection string:
   ```
   postgresql://postgres:GestionInterna1486@db.ydujorztkwodrsmgtcaj.supabase.co:5432/postgres
   ```
5. Select all environments: ✅ Production ✅ Preview ✅ Development
6. Click **Save**

### 2. Run Prisma Migrations

After adding the connection string, you need to set up your database schema:

**Option A: Run locally**
```bash
# Make sure you have DATABASE_URL set
export DATABASE_URL="postgresql://postgres:GestionInterna1486@db.ydujorztkwodrsmgtcaj.supabase.co:5432/postgres"

# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# OR run migrations (for production)
npx prisma migrate deploy
```

**Option B: Run via Vercel build**

Your build command already includes `prisma generate`, and migrations can be added:

1. Option 1: Add migration to build command in `vercel.json`:
   ```json
   {
     "buildCommand": "prisma generate && prisma migrate deploy && next build"
   }
   ```

2. Option 2: Run migrations after first deployment manually:
   ```bash
   npx prisma migrate deploy
   ```

### 3. Verify Connection

Test the database connection:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:GestionInterna1486@db.ydujorztkwodrsmgtcaj.supabase.co:5432/postgres"

# Test connection with Prisma
npx prisma db pull
```

### 4. Security Notes

⚠️ **Important Security Considerations:**

- This connection string contains your database password
- Make sure it's only stored in environment variables, never in code
- Never commit this to Git (it should be in `.gitignore`)
- Keep the password secure

### 5. Supabase Dashboard

You can manage your database at:
- Supabase Dashboard: [supabase.com/dashboard](https://supabase.com/dashboard)
- Project URL: `db.ydujorztkwodrsmgtcaj.supabase.co`

## Database Schema

Your Prisma schema includes:

- **User** model (id, email, name, createdAt)
- **Video** model (id, title, description, driveFileId, duration, etc.)

After running migrations, these tables will be created in your Supabase database.

## Troubleshooting

### Connection Failed
- Check if the connection string is correct
- Verify Supabase database is running
- Check firewall/network settings

### Migration Errors
- Make sure DATABASE_URL is set correctly
- Check Prisma schema is valid
- Ensure you have permissions to create tables

## Next Steps in Deployment

1. ✅ Database connection string obtained
2. ⏭️ Add to Vercel environment variables
3. ⏭️ Deploy project
4. ⏭️ Run migrations
5. ⏭️ Test application

---

**Keep this connection string secure!** 🔒

