import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - .env.local first, then fallback to .env
const envResult = dotenv.config({ path: resolve(__dirname, '../.env.local') });
if (envResult.error) {
  dotenv.config({ path: resolve(__dirname, '../.env') }); // fallback to .env
}

// Safety check: Check if the MongoDB URI is safe to operate on (local only)
function isLocalMongoDBUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined');
    return false;
  }

  // Check for Atlas/shared database indicators
  const isAtlasOrRemote = uri.includes('mongodb+srv://') ||
                          uri.includes('mongodb.net') ||
                          uri.includes('mongodb.cloud') ||
                          (uri.startsWith('mongodb://') && !uri.includes('localhost') && !uri.includes('127.0.0.1'));

  if (isAtlasOrRemote) {
    console.error('ERROR: Refusing to operate on remote/shared database for safety');
    console.error('URI:', uri.replace(/:[^:@]+@/, ':***@')); // Hide password in logs
    return false;
  }

  // Allow localhost and 127.0.0.1
  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

  if (!isLocal) {
    console.error('WARNING: URI does not appear to be localhost:');
    console.error('URI:', uri.replace(/:[^:@]+@/, ':***@')); // Hide password in logs
    return false;
  }

  return true;
}

// Safety check
if (!isLocalMongoDBUri()) {
  console.error('ERROR: Refusing to operate on remote/shared database for safety');
  process.exit(1);
}

import User from '../src/models/User.js';

const seedUsers = [
  {
    email: 'admin@visionfit.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    phone: '09123456789',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true
  },
  {
    email: 'staff@visionfit.com',
    password: 'Staff123!',
    firstName: 'Staff',
    lastName: 'User',
    phone: '09234567890',
    role: 'STAFF',
    isActive: true,
    emailVerified: true
  },
  {
    email: 'user1@visionfit.com',
    password: 'User123!',
    firstName: 'User',
    lastName: 'One',
    phone: '09345678901',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true
  },
  {
    email: 'user2@visionfit.com',
    password: 'User123!',
    firstName: 'User',
    lastName: 'Two',
    phone: '09456789012',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true
  },
  {
    email: 'user3@visionfit.com',
    password: 'User123!',
    firstName: 'User',
    lastName: 'Three',
    phone: '09567890123',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });

    console.log('Connected to MongoDB');

    // Seed each user
    for (const userData of seedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified
      });

      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('Database seeding completed successfully!');

    // Close connection
    await mongoose.disconnect();

  } catch (error) {
    console.error('Error seeding database:');
    console.error(error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();