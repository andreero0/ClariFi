# Spacing Import Guidelines

## CRITICAL: Always Use Object Syntax for Spacing

**❌ NEVER DO THIS:**
```typescript
spacing[4]    // Array syntax - WRONG!
spacing[2]    // This causes "Property 'spacing' doesn't exist" errors
```

**✅ ALWAYS DO THIS:**
```typescript
spacing.lg    // Object syntax - CORRECT!
spacing.sm    // Use proper property names
```

## ALSO IMPORTANT: Always Import Spacing Directly

**❌ NEVER DO THIS:**
```typescript
import { spacing } from '../../constants';
import { colors, spacing } from '../../constants';
```

**✅ ALWAYS DO THIS:**
```typescript
import { spacing } from '../../constants/spacing';
```

## Root Cause Found and Fixed

The ClariFi mobile app experienced runtime errors like "spacing doesn't exist" due to **incorrect array syntax usage**, not just import issues. 

### Primary Root Cause: Array Syntax Instead of Object Syntax
1. **The Real Issue**: Files were using `spacing[4]` instead of `spacing.lg`
2. **Why This Failed**: `spacing` is an object `{xs: 4, sm: 8, md: 12, lg: 16...}`, not an array
3. **Runtime Error**: `spacing[4]` returns `undefined`, causing "Property 'spacing' doesn't exist"

### Secondary Issue: Barrel Export Circular Dependencies  
1. Files importing `spacing` from the barrel export (`../../constants`)
2. The barrel export potentially re-exports from other files that also import spacing
3. This creates a circular dependency that breaks at runtime

### Solution Applied
1. **Fixed Array Syntax**: Converted all `spacing[number]` to `spacing.property` syntax
2. **Fixed Imports**: `spacing` is intentionally excluded from the barrel export in `constants/index.ts`
3. **Always import `spacing` directly** from its source: `./constants/spacing`
4. This applies to both `spacing` and `SIZES` exports from that file

### Spacing Property Reference
```typescript
spacing = {
  xxs: 2,   // spacing.xxs
  xs: 4,    // spacing.xs  (was spacing[1])
  sm: 8,    // spacing.sm  (was spacing[2])
  md: 12,   // spacing.md  (was spacing[3])
  lg: 16,   // spacing.lg  (was spacing[4])
  xl: 24,   // spacing.xl  (was spacing[6])
  xxl: 32,  // spacing.xxl (was spacing[8])
  xxxl: 40, // spacing.xxxl
  xxxxl: 48 // spacing.xxxxl
}
```

## Prevention
- The ESLint rule should be added to prevent barrel imports of spacing
- Code reviews should check for this pattern
- When adding new constants, be careful about circular dependencies

## Fixed Files (Reference)
The following files were updated during the fix (January 2025):
- app/(tabs)/cards.tsx
- app/modals/quick-payment.tsx
- app/modals/enhanced-notification-settings.tsx
- app/modals/add-statement.tsx
- app/modals/community-post-create.tsx
- app/modals/credit-card-detail.tsx
- app/modals/community-post-detail.tsx
- app/modals/credit-card-form.tsx
- app/modals/ai-chat.tsx
- app/modals/community-support.tsx
- components/notifications/InAppAlertBanner.tsx
- components/notifications/NotificationCalendar.tsx