# Database Migration Guide

## 🚀 Quick Start - Run This Now!

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Run Migration
```bash
npx prisma migrate dev --name add_new_assessment_features
```

This will:
- Create all 7 new database tables
- Add 3 new enums
- Update existing tables with new relations
- Generate Prisma client with new types

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Start Backend
```bash
npm run dev
```

### Step 5: Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```

---

## 📊 What Gets Created

### New Tables
1. `formal_assessments` - Formal assessment referrals
2. `reading_skill_assessments` - Reading symptoms (50+ fields)
3. `writing_skill_assessments` - Writing symptoms (60+ fields)
4. `math_skill_assessments` - Math symptoms (60+ fields)
5. `lesson_plans` - Lesson planning records
6. `homework` - Homework assignments
7. `learning_materials` - Materials library

### Updated Tables
- `students` - Added relations to new assessment types
- `special_educator_profiles` - Added relations to new features
- `parent_profiles` - Added homework relation

### New Enums
- `SkillArea` (READING, WRITING, MATH)
- `MotivationLevel` (HIGH, MEDIUM, LOW)
- `HomeworkStatus` (ASSIGNED, IN_PROGRESS, SUBMITTED, REVIEWED, COMPLETED)

---

## ⚠️ Troubleshooting

### If Migration Fails

**Issue**: "Migration already exists"
```bash
# Reset migrations (development only!)
npx prisma migrate reset
npx prisma migrate dev
```

**Issue**: "Database connection error"
- Check your `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database credentials

**Issue**: "Type errors after migration"
```bash
# Regenerate Prisma client
npx prisma generate
# Restart TypeScript server in VS Code
```

---

## ✅ Verify Migration Success

After migration, you should see:
```
✔ Generated Prisma Client
✔ 7 new tables created
✔ 3 new enums added
✔ Relations updated
```

Test the API:
```bash
# Test formal assessment endpoint
curl -X GET http://localhost:5000/api/new-assessments/formal/educator/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Next Steps

1. ✅ Migration complete
2. ✅ Backend running
3. ✅ Frontend running
4. 🎉 Navigate to `/educator/new-assessments`
5. 🎉 Start creating assessments!

---

## 📝 Migration File Location

After running migration, check:
```
backend/prisma/migrations/YYYYMMDDHHMMSS_add_new_assessment_features/
```

This contains the SQL that was executed.

---

## 🔄 Rollback (If Needed)

To undo the migration (development only):
```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data!

---

## 💾 Backup Recommendation

Before running migration in production:
```bash
# Backup your database
pg_dump your_database > backup_$(date +%Y%m%d).sql
```

---

*Ready to migrate? Run the commands above!* 🚀

