# Supabase Setup Guide

## Prerequisites
- Supabase CLI installed (or use `npx supabase`)
- Your Supabase project created
- Environment variables configured

## Steps to Set Up Your Database

### 1. Get Your Project Reference ID
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Copy the project reference ID from the URL or project settings
   - It looks like: `abcdefghijklmnopqrst`

### 2. Link Your Local Project to Remote
```bash
npm run supabase:link YOUR_PROJECT_REF
```
Replace `YOUR_PROJECT_REF` with your actual project reference ID.

### 3. Push Your Database Schema
```bash
npm run supabase:push
```

This will apply all your migrations and create the necessary tables in your Supabase database.

### 4. Verify Setup
```bash
npm run supabase:status
```

## Environment Variables
Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Scripts
- `npm run supabase:link` - Link to your Supabase project
- `npm run supabase:push` - Push database schema
- `npm run supabase:status` - Check project status
- `npm run supabase:reset` - Reset database (⚠️ destructive)

## Troubleshooting
- If you get Docker errors, make sure Docker Desktop is running
- If linking fails, verify your project reference ID
- If push fails, check your Supabase project permissions
