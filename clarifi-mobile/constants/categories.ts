/**
 * Defines the default transaction categories and subcategories.
 * This is crucial for Feature 2: AI-Powered Transaction Categorization and Feature 3: Budget Dashboard.
 */

export interface Category {
  id: number;
  name: string;
  icon: string; // Suggested icon name (e.g., from a library like FontAwesome, MaterialIcons)
  color: string; // Hex color code
  is_system: boolean;
}

export const CATEGORIES: Category[] = [
  // Income
  {
    id: 1,
    name: 'Salary',
    icon: 'cash-multiple',
    color: '#4CAF50',
    is_system: true,
  },
  {
    id: 2,
    name: 'Freelance Income',
    icon: 'briefcase-outline',
    color: '#4CAF50',
    is_system: true,
  },
  {
    id: 3,
    name: 'Investment Income',
    icon: 'chart-line',
    color: '#4CAF50',
    is_system: true,
  },
  {
    id: 4,
    name: 'Other Income',
    icon: 'plus-circle-outline',
    color: '#4CAF50',
    is_system: true,
  },

  // Housing & Utilities
  {
    id: 10,
    name: 'Rent',
    icon: 'home-city-outline',
    color: '#FF5722',
    is_system: true,
  },
  {
    id: 11,
    name: 'Mortgage',
    icon: 'home-account',
    color: '#FF5722',
    is_system: true,
  },
  {
    id: 12,
    name: 'Property Taxes',
    icon: 'bank-outline',
    color: '#FF5722',
    is_system: true,
  },
  {
    id: 13,
    name: 'Home Insurance',
    icon: 'shield-home-outline',
    color: '#FF5722',
    is_system: true,
  },
  {
    id: 14,
    name: 'Electricity',
    icon: 'flash-outline',
    color: '#FF9800',
    is_system: true,
  },
  {
    id: 15,
    name: 'Water',
    icon: 'water-outline',
    color: '#2196F3',
    is_system: true,
  },
  {
    id: 16,
    name: 'Gas/Heating',
    icon: 'fire',
    color: '#FF9800',
    is_system: true,
  },
  { id: 17, name: 'Internet', icon: 'wifi', color: '#03A9F4', is_system: true },
  {
    id: 18,
    name: 'Phone/Mobile',
    icon: 'cellphone',
    color: '#03A9F4',
    is_system: true,
  },
  {
    id: 19,
    name: 'Home Maintenance',
    icon: 'tools',
    color: '#795548',
    is_system: true,
  },

  // Transportation
  {
    id: 20,
    name: 'Public Transport',
    icon: 'bus',
    color: '#673AB7',
    is_system: true,
  },
  {
    id: 21,
    name: 'Gas/Fuel',
    icon: 'gas-station-outline',
    color: '#673AB7',
    is_system: true,
  },
  {
    id: 22,
    name: 'Vehicle Insurance',
    icon: 'car-shield',
    color: '#673AB7',
    is_system: true,
  },
  {
    id: 23,
    name: 'Vehicle Maintenance',
    icon: 'car-wrench',
    color: '#673AB7',
    is_system: true,
  },
  {
    id: 24,
    name: 'Parking',
    icon: 'parking',
    color: '#607D8B',
    is_system: true,
  },
  {
    id: 25,
    name: 'Ride Sharing/Taxis',
    icon: 'taxi',
    color: '#607D8B',
    is_system: true,
  },

  // Food & Dining
  {
    id: 30,
    name: 'Groceries',
    icon: 'cart-outline',
    color: '#8BC34A',
    is_system: true,
  },
  {
    id: 31,
    name: 'Restaurants & Cafes',
    icon: 'silverware-fork-knife',
    color: '#CDDC39',
    is_system: true,
  },
  {
    id: 32,
    name: 'Coffee Shops',
    icon: 'coffee-outline',
    color: '#CDDC39',
    is_system: true,
  },
  {
    id: 33,
    name: 'Takeout & Delivery',
    icon: 'food-takeout-box-outline',
    color: '#CDDC39',
    is_system: true,
  },

  // Personal Care & Health
  {
    id: 40,
    name: 'Healthcare & Medical',
    icon: 'medical-bag',
    color: '#E91E63',
    is_system: true,
  },
  { id: 41, name: 'Pharmacy', icon: 'pill', color: '#E91E63', is_system: true },
  {
    id: 42,
    name: 'Gym & Fitness',
    icon: 'dumbbell',
    color: '#F44336',
    is_system: true,
  },
  {
    id: 43,
    name: 'Hair & Beauty',
    icon: 'content-cut',
    color: '#F44336',
    is_system: true,
  },
  {
    id: 44,
    name: 'Clothing & Accessories',
    icon: 'hanger',
    color: '#9C27B0',
    is_system: true,
  },

  // Entertainment & Leisure
  {
    id: 50,
    name: 'Streaming Services',
    icon: 'television-play',
    color: '#3F51B5',
    is_system: true,
  },
  {
    id: 51,
    name: 'Movies & Concerts',
    icon: 'movie-open-outline',
    color: '#3F51B5',
    is_system: true,
  },
  {
    id: 52,
    name: 'Books & Magazines',
    icon: 'book-open-page-variant-outline',
    color: '#3F51B5',
    is_system: true,
  },
  {
    id: 53,
    name: 'Hobbies & Sports',
    icon: 'gamepad-variant-outline',
    color: '#00BCD4',
    is_system: true,
  },
  {
    id: 54,
    name: 'Travel & Vacations',
    icon: 'airplane',
    color: '#009688',
    is_system: true,
  },

  // Education
  {
    id: 60,
    name: 'Tuition & Fees',
    icon: 'school-outline',
    color: '#FFC107',
    is_system: true,
  },
  {
    id: 61,
    name: 'Courses & Training',
    icon: 'certificate-outline',
    color: '#FFC107',
    is_system: true,
  },
  {
    id: 62,
    name: 'Student Loans',
    icon: 'bank-transfer',
    color: '#FFC107',
    is_system: true,
  },

  // Financial & Services
  {
    id: 70,
    name: 'Bank Fees',
    icon: 'alert-circle-outline',
    color: '#757575',
    is_system: true,
  },
  {
    id: 71,
    name: 'Loan Payments (Non-Student)',
    icon: 'credit-card-refund-outline',
    color: '#757575',
    is_system: true,
  },
  {
    id: 72,
    name: 'Insurance (Other)',
    icon: 'shield-account-outline',
    color: '#757575',
    is_system: true,
  },
  {
    id: 73,
    name: 'Professional Services',
    icon: 'account-tie-outline',
    color: '#757575',
    is_system: true,
  },

  // Gifts & Donations
  {
    id: 80,
    name: 'Gifts',
    icon: 'gift-outline',
    color: '#FF7043',
    is_system: true,
  },
  {
    id: 81,
    name: 'Charity & Donations',
    icon: 'heart-outline',
    color: '#FF7043',
    is_system: true,
  },

  // Transfers & Payments (Special Categories)
  {
    id: 90,
    name: 'Credit Card Payment',
    icon: 'credit-card-check-outline',
    color: '#424242',
    is_system: true,
  },
  {
    id: 91,
    name: 'Transfers (Internal)',
    icon: 'swap-horizontal',
    color: '#424242',
    is_system: true,
  },
  {
    id: 92,
    name: 'Savings Contribution',
    icon: 'piggy-bank-outline',
    color: '#4CAF50',
    is_system: true,
  },
  {
    id: 93,
    name: 'Investment Contribution',
    icon: 'trending-up',
    color: '#4CAF50',
    is_system: true,
  },

  // Miscellaneous
  {
    id: 100,
    name: 'Miscellaneous',
    icon: 'dots-horizontal-circle-outline',
    color: '#9E9E9E',
    is_system: true,
  },
  {
    id: 101,
    name: 'Uncategorized',
    icon: 'help-circle-outline',
    color: '#BDBDBD',
    is_system: true,
  },
];

// Function to get a category by its ID
export const getCategoryById = (id: number): Category | undefined => {
  return CATEGORIES.find(category => category.id === id);
};

console.log('constants/categories.ts loaded');

export {}; // Ensures this is treated as a module
