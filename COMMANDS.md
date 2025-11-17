# 🛠️ Command Reference Guide

Quick reference for all commands needed to manage the system.

## 📦 Installation & Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Create new migration after schema change
npx prisma migrate dev --name "description of change"

# Push schema to database (production)
npx prisma db push
```

## 🌱 Database Seeding Commands

```bash
# Run complete seeder (recommended for first setup)
npm run db:seed

# Alternative using prisma seed command
npx prisma db seed

# Reload database with fresh seed
npm run db:seed

# View database with Prisma Studio
npx prisma studio
```

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Start on specific port
npm run dev -- -p 3001

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run linter with fix
npm run lint -- --fix
```

## 📊 Database Commands

```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Show database status
npx prisma migrate status

# Validate schema
npx prisma validate

# Format schema
npx prisma format
```

## 🔍 Development Debugging

```bash
# Check TypeScript errors
npx tsc --noEmit

# View build output size
npm run build -- --analyze

# Debug Prisma queries
DEBUG=* npm run dev

# Open browser DevTools
# Press F12 in your browser while dev server running
```

## 📝 Common Workflow Commands

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup environment (create .env.local with your config)
# DATABASE_URL=...
# NEXT_PUBLIC_SUPABASE_URL=...

# 3. Run migrations
npx prisma migrate dev

# 4. Load seed data
npm run db:seed

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

### After Schema Changes
```bash
# 1. Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name "your_change_description"

# 3. Prisma Client auto-generates
# (Already included in migrate dev)

# 4. Run dev server to test
npm run dev
```

### Reset Database Safely
```bash
# WARNING: This deletes ALL data

# 1. Create migration first (backup schema)
npx prisma migrate dev

# 2. Reset database
npx prisma migrate reset

# 3. This runs all migrations + seed automatically
```

### Production Deployment
```bash
# 1. Build the application
npm run build

# 2. Push schema to production database
npx prisma db push

# 3. (Optional) Run seed if needed
npm run db:seed

# 4. Start production server
npm start
```

## 🔐 Authentication Commands

### Via Supabase CLI (Optional)
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_id

# Manage auth users
supabase auth users list

# View auth logs
supabase auth logs
```

## 📊 Useful Debugging Queries

### Via Prisma Studio
Open in Prisma Studio and run these queries:

```prisma
// Count all students
Student.count()

// Get students with their class
Student.findMany({ 
  include: { class: true }
})

// Get attendance for specific date
Attendance.findMany({
  where: {
    date: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31')
    }
  }
})
```

## 🧪 Testing Commands

```bash
# Run all tests (when test suite is setup)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📈 Performance Commands

```bash
# Analyze bundle size
npm run build -- --analyze

# Check dependencies
npm list

# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix
```

## 🐛 Troubleshooting Commands

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset Prisma
npx prisma migrate reset

# View Prisma errors in detail
npx prisma validate --verbose

# Check TypeScript
npx tsc --noEmit

# Check environment variables
echo $DATABASE_URL  # On Unix/Linux/Mac
echo %DATABASE_URL%  # On Windows
```

## 📦 Package Management

```bash
# Update all packages
npm update

# Update specific package
npm update package-name

# Install new package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Remove package
npm uninstall package-name

# Check for outdated dependencies
npm outdated
```

## 🚀 Quick Start Commands (Copy-Paste Ready)

### First Time (Fresh Install)
```bash
git clone <repo-url>
cd tk-absensi
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
# Visit http://localhost:3000
```

### Later Sessions (Development)
```bash
cd tk-absensi
npm run dev
# Visit http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

## 🔗 Environment Variable Setup

Create `.env.local` file:
```bash
# Copy and fill with your values
DATABASE_URL="postgresql://user:password@localhost:5432/tk_absensi"
DIRECT_URL="postgresql://user:password@localhost:5432/tk_absensi"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="xxxxx"
```

## 🎯 Development Tips

### Tip 1: Use Prisma Studio for quick data management
```bash
npx prisma studio
# Open http://localhost:5555
# Manage data visually without writing queries
```

### Tip 2: Check logs while developing
```bash
# Dev server shows request logs
npm run dev
# Watch for any errors in console
```

### Tip 3: TypeScript error checking
```bash
# Check TypeScript errors without building
npx tsc --noEmit
```

### Tip 4: Format code
```bash
# Format all files
npx prettier --write .

# Format specific file
npx prettier --write app/page.tsx
```

## 📋 Checklist for Common Tasks

### Adding a New Feature
- [ ] Update `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name "feature_name"`
- [ ] Create server actions in `actions.ts`
- [ ] Create page component
- [ ] Add navigation menu in `components/main-nav.tsx`
- [ ] Test with `npm run dev`

### Deploying to Production
- [ ] Run `npm run build` (check for errors)
- [ ] Test build: `npm start`
- [ ] Push code to git
- [ ] Deploy using your platform (Vercel, Netlify, etc.)
- [ ] Run migrations: `npx prisma db push`
- [ ] Verify on production URL

### Resetting Development Database
- [ ] Stop dev server (Ctrl+C)
- [ ] Run `npx prisma migrate reset`
- [ ] Confirm by typing 'y'
- [ ] Database is reset with fresh seed data
- [ ] Start dev server: `npm run dev`

## 🔧 Git Commands

```bash
# Initialize git (if needed)
git init

# Add all changes
git add .

# Commit changes
git commit -m "description of changes"

# Push to remote
git push origin main

# View status
git status

# View commit history
git log --oneline
```

## 📞 Getting Help

```bash
# Get help for any npm command
npm help <command>

# Get help for Prisma
npx prisma --help

# Get help for specific Prisma command
npx prisma <command> --help
```

---

## Quick Command Summary Table

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Setup DB | `npx prisma migrate dev` |
| Load test data | `npm run db:seed` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Production | `npm start` |
| Database GUI | `npx prisma studio` |
| Lint code | `npm run lint` |
| Reset DB | `npx prisma migrate reset` |
| Check errors | `npx tsc --noEmit` |

---

**Bookmark this guide for quick reference! 📚**
