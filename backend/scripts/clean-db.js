#!/usr/bin/env node

import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Parse the URI to get the database name
const uriObj = new URL(MONGODB_URI.replace('mongodb+srv://', 'mongodb://'));
const dbName = uriObj.pathname.substring(1); // Remove leading slash

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');

if (!confirm) {
  console.log('DRY RUN MODE');
  console.log(`Database URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  console.log(`Database name: ${dbName}`);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {

    });

    const db = mongoose.connection.db;

    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections
      .map(col => col.name)
      .filter(name => !name.startsWith('system.')); // Exclude system collections

    console.log(`Found ${collectionNames.length} user collections:`);
    collectionNames.forEach(name => {
      console.log(`  - ${name}`);
    });

    // For each collection, count documents
    const counts = {};
    for (const collectionName of collectionNames) {
      const count = await db.collection(collectionName).countDocuments();
      counts[collectionName] = count;
      if (!confirm) {
        console.log(`${collectionName}: ${count} documents`);
      }
    }

    // Determine which 3 users to keep (one per role)
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    const usersByRole = {
      ADMIN: [],
      STAFF: [],
      CUSTOMER: [],
    };
    users.forEach(user => {
      if (user.role) {
        usersByRole[user.role].push(user);
      }
    });

    const usersToKeep = [];
    Object.keys(usersByRole).forEach(role => {
      if (usersByRole[role].length > 0) {
        // Keep the first user of each role
        usersToKeep.push(usersByRole[role][0]);
      }
    });

    if (!confirm) {
      console.log('\nUsers to keep (one per role):');
      usersToKeep.forEach(user => {
        console.log(`  - ${user.email} (role: ${user.role})`);
      });
    }

    if (confirm) {
      console.log('\nStarting deletion...');
      // Delete from all collections except the three users
      for (const collectionName of collectionNames) {
        if (collectionName === 'users') {
          // Delete all users except the three to keep
          const result = await db.collection('users').deleteMany({
            _id: { $nin: usersToKeep.map(user => user._id) },
          });
          console.log(`Deleted ${result.deletedCount} documents from users`);
        } else {
          // Delete all documents from other collections
          const result = await db.collection(collectionName).deleteMany({});
          console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
        }
      }
      console.log('Deletion completed.');
    } else {
      console.log('\nDRY RUN: No data was deleted.');
      console.log('To actually delete, run with --confirm flag.');
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();