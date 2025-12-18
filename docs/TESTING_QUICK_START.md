# 🧪 QUICK START TESTING GUIDE

## ⚡ 30-Second Setup

### 1. Start Backend
```bash
cd backend
npm start
```
✅ Server runs on `http://localhost:5000`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
✅ App runs on `http://localhost:5173`

### 3. Navigate to Project
- Go to **Projects page**
- Click **"View Details"** on any project
- Or URL: `http://localhost:5173/projects/[projectId]`

---

## 📋 **FEATURE A - Task Integration**

### What to Look For
```
Left Column:
├─ 📊 PROJECT ANALYTICS (heading)
├─ Progress bar (e.g., "60%")
├─ Status breakdown (3 columns with icons)
├─ Priority distribution (3 badges)
└─ Member workload (table with progress bars)

Main Content:
├─ 📋 PROJECT TASKS (5) (heading with count)
├─ Table with columns:
│  ├─ Task Title
│  ├─ Status (colored badge)
│  ├─ Priority (colored badge)
│  ├─ Assigned To
│  ├─ Due Date
│  └─ View (button)
└─ "Showing X of Y tasks" message
```

### Test Steps
1. ✅ **Load project details page**
   - Tasks should appear in a table
   - First 5 tasks shown
   - If more than 5: "Showing 5 of X tasks" displayed

2. ✅ **Check task colors**
   - Status: Green=Done, Yellow=In Progress, Gray=To Do
   - Priority: Red=High, Yellow=Medium, Blue=Low

3. ✅ **Click "View" button on a task**
   - Should navigate to `/tasks/[taskId]`
   - Task details page loads

4. ✅ **Click "View All Tasks" button** (if available)
   - Should navigate to tasks page
   - Filtered by project ID (if implemented)

5. ✅ **Test with no tasks**
   - Create a new project with no tasks
   - Should show "No tasks found" or empty table

---

## 📊 **FEATURE B - Analytics Dashboard**

### What to Look For
```
┌─ Task Completion ─────────────────┐
│ Progress Bar: ▓▓▓░░░░░░░░░░ 60%  │
│ Label: "Task Completion"          │
└───────────────────────────────────┘

┌─ Status Breakdown ────────────────┐
│ 🟢 3       🟡 1       ⚫ 1        │
│ Done    In Progress  To Do        │
└───────────────────────────────────┘

┌─ Priority Distribution ───────────┐
│ [🔴 High: 2] [🟡 Med: 2] [🔵 Low: 1]│
└───────────────────────────────────┘

┌─ Member Workload ─────────────────┐
│ John    ▓▓▓░░░ 3 tasks (60%)     │
│ Jane    ▓░░░░░ 1 task (20%)      │
│ Mike    ▓░░░░░ 1 task (20%)      │
└───────────────────────────────────┘
```

### Test Steps
1. ✅ **Verify calculations**
   - Count tasks: 5 total
   - Count completed: If 3 done → 60%
   - Count by status: Breakdown should match task list
   - Count by priority: Match task priorities
   - Count by member: Each member's task count

2. ✅ **Check progress bar**
   - Width should match percentage (e.g., 60% = 60% filled)
   - Color should be green
   - Shows percentage number

3. ✅ **Verify icons**
   - ✓ (CheckCircle) for Done count
   - ⏳ (Clock) for In Progress count
   - ⚠️ (AlertCircle) for To Do count

4. ✅ **Check member workload**
   - Should only show members with tasks in project
   - Progress bar width matches percentage
   - Shows "X task(s)" in label

5. ✅ **Test real-time updates**
   - If tasks load dynamically → Analytics should recalculate
   - Edit a task status → Analytics should update

6. ✅ **Test with different data**
   - 0 tasks → 0% completion
   - 1 task done → 100% completion
   - All same priority → Show only that priority badge
   - One member → Show only that member's workload

---

## 🔔 **FEATURE C - Notifications**

### Success Toast Notification
```
┌─────────────────────────────────────┐
│ ✓ Member added successfully         │
│ (appears top-right, auto-closes)    │
└─────────────────────────────────────┘
Duration: 2 seconds
Position: Top-right corner
```

### Error Alert
```
┌─────────────────────────────────────┐
│ ✕ Error!                            │
│                                     │
│ Failed to add member                │
│                                     │
│          [OK]                       │
└─────────────────────────────────────┘
```

### Confirmation Dialog
```
┌─────────────────────────────────────┐
│ ⚠ Remove Member?                    │
├─────────────────────────────────────┤
│ This member will be removed from    │
│ the project                         │
│                                     │
│ [Cancel]      [Yes, Remove]        │
└─────────────────────────────────────┘
```

### Test Steps

#### Test: Add Member
1. ✅ Click **"👥 Manage"** button
2. ✅ Select member from dropdown
3. ✅ Click **"Add"** button
4. ✅ See toast: **"✓ Member added successfully"**
   - Should appear in top-right
   - Should auto-dismiss in 2 seconds
   - Members list updates

#### Test: Add Duplicate Member
1. ✅ Click **"👥 Manage"** button
2. ✅ Select a member already added
3. ✅ Click **"Add"** button
4. ✅ See alert: **"Member already added"**
   - Should be info dialog (blue icon)
   - Requires [OK] to dismiss
   - Modal stays open

#### Test: Remove Member
1. ✅ In members list, find member
2. ✅ Click **"Remove"** button
3. ✅ See confirmation: **"Remove Member?"**
   - Message: "This member will be removed from the project"
   - [Cancel] and [Yes, Remove] buttons
4. ✅ Click **"Yes, Remove"**
5. ✅ See toast: **"✓ Member removed successfully"**
   - Members list updates
   - Member disappears from list

#### Test: Cancel Remove
1. ✅ Click **"Remove"** on a member
2. ✅ Confirmation dialog appears
3. ✅ Click **"Cancel"**
4. ✅ Dialog closes, member stays in list

#### Test: Toggle Status
1. ✅ Click **"✏️ Edit"** button
2. ✅ Click **"Toggle Status"** or change status dropdown
3. ✅ See toast: **"✓ Project archived"** or **"✓ Project activated"**
   - Status badge updates (🟢 Active → 🟡 Archived)

#### Test: Validation Error
1. ✅ Click **"👥 Manage"** button
2. ✅ Don't select a member (dropdown empty)
3. ✅ Click **"Add"** button
4. ✅ See warning: **"Please select a member"**
   - Modal stays open
   - Add button remains disabled

---

## 🎯 **Complete Test Scenario**

### Scenario: Review Website Redesign Project

```
1. LOGIN as Admin
   └─ Navigate to Projects page

2. VIEW PROJECT
   └─ Click "View Details" on "Website Redesign"
   └─ See Project Info card with name, status, owner, dates

3. CHECK TASKS (Feature A)
   └─ See 5 tasks in table
   └─ Tasks: Homepage Redesign, API Integration, Database Setup, Testing Suite, Documentation
   └─ Verify colors:
      ✓ Homepage: Green (Done), High (Red)
      ✓ API: Yellow (In Prog), High (Red)
      ✓ DB: Green (Done), Med (Yellow)
      ✓ Testing: Gray (To Do), Med (Yellow)
      ✓ Docs: Gray (To Do), Low (Blue)
   └─ Click "View" on one task → See task details page

4. CHECK ANALYTICS (Feature B)
   └─ See progress bar showing 60% (3/5 done)
   └─ See status breakdown:
      ✓ Done: 3
      ✓ In Progress: 1
      ✓ To Do: 1
   └─ See priority:
      ✓ High: 2
      ✓ Medium: 2
      ✓ Low: 1
   └─ See member workload:
      ✓ John: 3 tasks (60%)
      ✓ Jane: 1 task (20%)
      ✓ Mike: 1 task (20%)

5. MANAGE TEAM (Feature C)
   └─ Click "👥 Manage" button
   └─ See dropdown with team members
   └─ Select "Sarah Williams"
   └─ Click "Add"
   └─ ✓ Toast appears: "Member added successfully"
   └─ See Sarah in members list

6. REMOVE MEMBER (Feature C)
   └─ Click "Remove" on Sarah
   └─ ⚠ Confirmation: "Remove Member?"
   └─ Click "Yes, Remove"
   └─ ✓ Toast appears: "Member removed successfully"
   └─ Sarah removed from list

7. EDIT STATUS (Feature C)
   └─ Click "✏️ Edit"
   └─ Click "Toggle Status"
   └─ ✓ Toast: "Project archived"
   └─ Status badge changes to 🟡 Archived

8. VERIFY NO ERRORS
   └─ Open DevTools (F12)
   └─ Check Console for errors
   └─ Should be clean (no red errors)
```

---

## 🐛 **Troubleshooting**

### Tasks Not Showing
```
Problem: Empty table in Tasks section
Solution:
1. Check backend console for errors
2. Verify tasks exist in database
3. Check projectId is correct
4. Check API response: GET /api/tasks
5. Verify task's projectId matches project's _id
```

### Analytics Wrong Numbers
```
Problem: Progress bar shows 0% or wrong percentage
Solution:
1. Verify tasks are being loaded (check table)
2. Check task status values: 'done', 'in-progress', 'todo'
3. Check count in console:
   └─ setTasks called with correct array
   └─ getTaskStats() returns correct counts
4. Verify math: (completed / total) * 100
```

### Notifications Not Showing
```
Problem: No toast when adding member
Solution:
1. Check browser console for errors
2. Verify API call succeeds (check Network tab)
3. Check SweetAlert2 library is imported
4. Check Swal.fire() code has correct parameters
5. Verify timer: 2000ms (2 seconds)
```

### Wrong Colors
```
Problem: Status or priority colors incorrect
Solution:
1. Check getStatusColor() function
   └─ 'done' → 'success' (green)
   └─ 'in-progress' → 'warning' (yellow)
   └─ 'todo' → 'secondary' (gray)
2. Check getPriorityColor() function
   └─ 'high' → 'danger' (red)
   └─ 'medium' → 'warning' (yellow)
   └─ 'low' → 'info' (blue)
3. Verify task data has correct status/priority values
```

---

## 📱 **Browser Testing**

### Chrome DevTools
```
1. F12 → Open DevTools
2. Console tab → Check for errors (red text)
3. Network tab → Check API calls
4. Application → Check localStorage (auth token)
5. Elements → Inspect components
```

### Responsive Testing
```
Desktop (1200px+):
  └─ Analytics on left, Tasks below
  └─ Full table visibility

Tablet (768px-1199px):
  └─ Analytics stacked
  └─ Table may scroll horizontally

Mobile (<768px):
  └─ Single column layout
  └─ Table with horizontal scroll
```

---

## ✅ **Success Criteria**

- [ ] **Task Integration**: Tasks display with correct colors and filters
- [ ] **Analytics**: Progress bar matches actual completion
- [ ] **Member Workload**: Correctly counts tasks per member
- [ ] **Notifications**: Toast appears and auto-dismisses
- [ ] **Confirmation**: Dialog appears before destructive action
- [ ] **No Errors**: Console is clean (0 errors)
- [ ] **Responsive**: Works on desktop, tablet, mobile
- [ ] **Performance**: Page loads in < 2 seconds
- [ ] **Data**: All calculations match manual counts

---

## 🚀 **Next Steps After Testing**

If all tests pass:
1. ✅ Create a Pull Request
2. ✅ Have it reviewed
3. ✅ Merge to main branch
4. ✅ Deploy to staging
5. ✅ Deploy to production

If issues found:
1. ❌ Check browser console for error messages
2. ❌ Check backend logs for API errors
3. ❌ Check MongoDB for data issues
4. ❌ Debug with console.log() statements
5. ❌ Ask for help in troubleshooting

---

**Test Duration:** ~15 minutes
**Expected Result:** ✅ All Features Working Perfectly
**Status:** Ready to Test! 🎉
