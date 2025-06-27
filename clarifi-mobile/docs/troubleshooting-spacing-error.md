# Troubleshooting: Spacing Property Error Fix

## Issue Description
The app was experiencing a runtime error during startup:
```
ERROR ReferenceError: Property 'spacing' doesn't exist, js engine: hermes
```

This error occurred consistently between the loading of `services/storage/migrations.ts` and `constants/categories.ts`.

## Root Cause
The error was caused by theme objects (`lightColors` and `darkColors` in `constants/colors.ts`) missing a `spacing` property that was being accessed somewhere in the codebase. The theme objects are used throughout the app via `ThemeContext`, and some component or library was expecting them to include spacing values.

## Solution Applied

### 1. Added Spacing to Theme Objects
Added spacing properties to both `lightColors` and `darkColors` in `constants/colors.ts`:

```typescript
// Spacing property to fix potential theme.spacing access
spacing: {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, xxxxl: 48
},
```

### 2. Fixed Circular Dependencies
- Changed `components/layout/Spacer.tsx` to import spacing directly: `import { spacing } from '../../constants/spacing'`
- Changed `components/layout/Container.tsx` to import spacing directly: `import { spacing } from '../../constants/spacing'`
- Reordered `constants/index.ts` to load spacing first

## Files Modified
- `/constants/colors.ts` - Added spacing property to lightColors and darkColors
- `/components/layout/Spacer.tsx` - Fixed import to avoid circular dependency
- `/components/layout/Container.tsx` - Fixed import to avoid circular dependency
- `/constants/index.ts` - Reordered exports to load spacing first

## Verification
After applying these fixes, the app should start without the spacing property error. The spacing values are now available both as direct imports from `constants/spacing` and as properties on theme objects accessed via `useTheme()`.

## Prevention
To prevent similar issues in the future:
1. Ensure theme objects include all properties that components might expect
2. Avoid importing from barrel exports (`constants/index.ts`) in layout components that might be used during constants loading
3. Import directly from specific files when possible to avoid circular dependencies