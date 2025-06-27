/**
 * Contains constants related to supported banks and their configurations.
 * This is primarily for Feature 1: User Onboarding & Statement Import.
 */

export interface BankDefinition {
  id: string; // e.g., 'td', 'rbc'
  name: string; // Full bank name, e.g., "TD Canada Trust"
  shortName?: string; // e.g., "TD"
  logoUrl?: string; // Path to a local asset or a remote URL
  accentColor?: string; // Hex color for UI theming
  logoComponent?: React.ComponentType<{ size?: number; color?: string }>; // Custom logo component
  supportedStatementFormats?: Array<'pdf' | 'csv' | 'ofx'>; // For future use
  // Common date formats found in their statements (for parsing hints)
  statementDateFormats?: string[];
  // Keywords that often appear on their statements (for OCR confidence)
  statementKeywords?: string[];
}

// PRD: Only these 6 banks required for MVP as specified in Feature 1
export const SUPPORTED_BANKS: BankDefinition[] = [
  {
    id: 'td',
    name: 'TD Canada Trust',
    shortName: 'TD',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#00B04F', // TD Green
    statementKeywords: ['TD Canada Trust', 'Toronto-Dominion Bank', 'TD Bank'],
    statementDateFormats: ['MMM D, YYYY', 'MM-DD-YYYY', 'YYYY/MM/DD'],
  },
  {
    id: 'rbc',
    name: 'RBC Royal Bank',
    shortName: 'RBC',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#005DAA', // RBC Blue
    statementKeywords: ['Royal Bank', 'RBC', 'Royal Bank of Canada'],
    statementDateFormats: ['MMM DD, YYYY', 'MM/DD/YY', 'YYYY-MM-DD'],
  },
  {
    id: 'bmo',
    name: 'BMO Bank of Montreal',
    shortName: 'BMO',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#0079C1', // BMO Blue
    statementKeywords: ['BMO', 'Bank of Montreal'],
    statementDateFormats: ['MMMM D, YYYY', 'YYYY-MM-DD'],
  },
  {
    id: 'scotia',
    name: 'Scotiabank',
    shortName: 'Scotia',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#ED1C24', // Scotiabank Red
    statementKeywords: ['Scotiabank', 'Bank of Nova Scotia'],
    statementDateFormats: ['DD MMMM YYYY', 'MM/DD/YYYY'],
  },
  {
    id: 'cibc',
    name: 'CIBC',
    shortName: 'CIBC',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#AA172B', // CIBC Red
    statementKeywords: ['CIBC', 'Canadian Imperial Bank of Commerce'],
    statementDateFormats: ['MON DD, YYYY', 'DD/MM/YY'],
  },
  {
    id: 'national-bank',
    name: 'National Bank of Canada',
    shortName: 'National Bank',
    logoUrl: undefined, // PRD: Use styled text logo
    accentColor: '#EF3E42', // National Bank Red
    statementKeywords: ['National Bank', 'NBC', 'Banque Nationale'],
    statementDateFormats: ['YYYY.MM.DD', 'D MMMM YYYY'],
  },
];

export const getBankById = (id: string): BankDefinition | undefined => {
  return SUPPORTED_BANKS.find(bank => bank.id === id.toLowerCase());
};

console.log('constants/banks.ts loaded');

export {}; // Ensures this is treated as a module
