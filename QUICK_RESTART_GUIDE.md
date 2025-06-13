# ClariFi - Quick Restart Guide
## Get back to work in under 2 minutes

### 1️⃣ Start Backend Services (Terminal 1)
```bash
cd /Users/aero/Dev/ClariFi
docker compose up -d redis postgres
cd clarifi-api
npm run start:dev
```
Wait for: "Nest application successfully started"

### 2️⃣ Start Mobile App (Terminal 2)
```bash
cd /Users/aero/Dev/ClariFi/clarifi-mobile
npm start
```
Then press `i` for iOS simulator

### 3️⃣ Common Issues & Fixes

**If Redis connection error:**
```bash
docker compose down
docker compose up -d redis postgres
```

**If Expo port conflict:**
```bash
pkill -f "expo start"
npm start
```

**If animation errors appear:**
- These are already fixed in dashboard.tsx
- Other screens may need similar fixes

### 4️⃣ Key Files to Remember
- **Memory Bank**: `/clarifi-mobile/CLAUDE_MEMORY_BANK.md`
- **TODO State**: `/clarifi-mobile/CLAUDE_TODO_STATE.md`
- **Dashboard**: `/clarifi-mobile/app/(tabs)/dashboard.tsx`
- **PRD Docs**: `/Docs/05_UI_UX_Screen_Designs_Per_Feature/`

### 5️⃣ Current State Summary
✅ Backend working
✅ Frontend running
✅ Dashboard redesigned with 2024 standards
✅ Professional icons and typography
⏳ Other screens need same polish level

### 6️⃣ Design Reminders
- NO emojis in UI (except transaction icons temporarily)
- Use Lucide icons
- Follow PRD exactly
- Research modern patterns
- Think before implementing

---
**Your last message to Claude should be:**
"I've restarted my computer. Please check the CLAUDE_MEMORY_BANK.md file to understand our previous context and let me know you're ready to continue from where we left off."