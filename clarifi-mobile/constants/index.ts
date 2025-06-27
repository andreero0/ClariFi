// constants/index.ts
// NOTE: DO NOT export spacing or textStyles from this barrel export to prevent circular dependencies
// Always import directly:
// - import { spacing } from './constants/spacing';
// - import { textStyles } from './constants/typography';

export * from './colors';
// export * from './typography'; // Disabled - textStyles causes circular dependency issues
export { fonts, fontWeights, fontSizes } from './typography'; // Export safe typography constants
export * from './theme';
export * from './banks';
export * from './categories';
export * from './merchants';
export * from './api';
// export * from './CommonStyles'; // Disabled - causes circular dependency with spacing
// export * from './spacing'; // Disabled - causes circular dependency issues
// Add other constants files as they are created, e.g.:
// export * from './appSettings';
// export * from './themeColors';

console.log('constants/index.ts loaded');
