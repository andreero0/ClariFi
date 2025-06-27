# Known Issues and Solutions

## React Hooks "Rendered fewer hooks than expected" Error

### Issue Description
Dashboard component failing to render with error: `Warning: React has detected a change in the order of Hooks called by DashboardScreen. This will lead to bugs and errors if not fixed.`

### Root Cause
1. **Hooks inside render functions**: `useState` and `useRef` hooks were called inside `renderSummaryCards()` function, violating Rules of Hooks
2. **Navigation race condition**: Multiple navigation calls to dashboard happening simultaneously
3. **Infinite loop in useEffect**: Dependencies included state variables that were updated within the effect

### Solution Steps
1. **Move hooks to component level**: Extract all hooks from render functions to main component body
2. **Fix navigation race conditions**: Ensure only one navigation system handles routing (remove manual navigation when auth system handles it)
3. **Fix useEffect dependencies**: Only include stable dependencies, avoid state variables that are updated in the effect
4. **Consistent hook order**: Ensure all hooks are called in the same order every render

### Prevention
- Never call hooks inside render functions, loops, or conditional statements
- Use ESLint plugin `react-hooks/rules-of-hooks` to catch violations
- Always validate useEffect dependencies to prevent infinite loops
- Coordinate navigation between different systems to prevent race conditions

### Debugging Tips
- Add timestamps to component mounting logs
- Track navigation calls with console.log
- Use React DevTools to inspect hook order and state changes

---
*Documented: December 13, 2025*