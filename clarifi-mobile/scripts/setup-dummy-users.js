#!/usr/bin/env node

/**
 * Script to set up dummy user accounts for testing ClariFi
 * Run this with: node scripts/setup-dummy-users.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Note: Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dummy users to create
const dummyUsers = [
  {
    email: 'demo@clarifi.app',
    password: 'Demo123!',
    user_metadata: {
      full_name: 'Demo User',
      preferred_language: 'en',
      onboarding_completed: true,
    },
  },
  {
    email: 'newcomer@clarifi.app',
    password: 'Newcomer123!',
    user_metadata: {
      full_name: 'Sarah Newcomer',
      preferred_language: 'en',
      onboarding_completed: false,
    },
  },
  {
    email: 'student@clarifi.app',
    password: 'Student123!',
    user_metadata: {
      full_name: 'Alex Student',
      preferred_language: 'en',
      onboarding_completed: true,
    },
  },
  {
    email: 'professional@clarifi.app',
    password: 'Professional123!',
    user_metadata: {
      full_name: 'Jamie Professional',
      preferred_language: 'fr',
      onboarding_completed: true,
    },
  },
];

async function setupDummyUsers() {
  console.log('🚀 Setting up dummy users for ClariFi...\n');

  for (const userData of dummyUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);

      // Create user with admin client
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true, // Auto-confirm email
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(
            `  ❌ Error creating ${userData.email}:`,
            error.message
          );
        }
      } else {
        console.log(`  ✅ Successfully created: ${userData.email}`);

        // If user has completed onboarding, we might want to add some dummy data
        if (userData.user_metadata.onboarding_completed && data.user) {
          await setupUserData(data.user.id, userData.user_metadata.full_name);
        }
      }
    } catch (err) {
      console.error(
        `  ❌ Unexpected error creating ${userData.email}:`,
        err.message
      );
    }
  }

  console.log('\n✨ Dummy user setup complete!');
  console.log('\n📋 Test Accounts:');
  dummyUsers.forEach(user => {
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(
      `  Status: ${user.user_metadata.onboarding_completed ? 'Onboarded' : 'Needs Onboarding'}`
    );
    console.log('  ---');
  });
}

async function setupUserData(userId, fullName) {
  try {
    // Create basic user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        preferred_language: 'en',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.log(
        `    ⚠️  Profile creation failed (table might not exist): ${profileError.message}`
      );
    } else {
      console.log(`    ✅ Created profile for ${fullName}`);
    }

    // Add some dummy financial data if tables exist
    // This is optional and will silently fail if tables don't exist
    await setupDummyFinancialData(userId);
  } catch (err) {
    console.log(`    ⚠️  Additional data setup failed: ${err.message}`);
  }
}

async function setupDummyFinancialData(userId) {
  // Add dummy transactions
  const dummyTransactions = [
    {
      user_id: userId,
      date: new Date('2024-12-01').toISOString(),
      description: 'Grocery Store Purchase',
      amount: -85.43,
      category: 'Groceries',
      merchant: 'Metro',
      account: 'Checking',
    },
    {
      user_id: userId,
      date: new Date('2024-12-02').toISOString(),
      description: 'Salary Deposit',
      amount: 3500.0,
      category: 'Income',
      merchant: 'Employer Corp',
      account: 'Checking',
    },
    {
      user_id: userId,
      date: new Date('2024-12-03').toISOString(),
      description: 'Coffee Shop',
      amount: -4.75,
      category: 'Dining',
      merchant: 'Tim Hortons',
      account: 'Credit Card',
    },
  ];

  try {
    const { error } = await supabase
      .from('transactions')
      .insert(dummyTransactions);

    if (!error) {
      console.log(
        `    ✅ Added ${dummyTransactions.length} dummy transactions`
      );
    }
  } catch (err) {
    // Silently ignore if transactions table doesn't exist
  }
}

// Run the setup
setupDummyUsers().catch(console.error);
