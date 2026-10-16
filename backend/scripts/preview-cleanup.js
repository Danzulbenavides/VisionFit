import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Get current filename and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - .env.local first, then fallback to .env
const envResult = dotenv.config({ path: resolve(__dirname, '../.env.local') });
if (envResult.error) {
  dotenv.config({ path: resolve(__dirname, '../.env') }); // fallback to .env
}

// Import utilities after env is loaded
import { isLocalMongoDBUri, getDatabaseName } from './db-utils.js';
import mongoose from 'mongoose';

// Safety check
if (!isLocalMongoDBUri()) {
  console.error('ERROR: Refusing to operate on remote/shared database for safety');
  process.exit(1);
}

const dbName = getDatabaseName();

console.log(`Previewing data in local database: ${dbName}`);
console.log('='.repeat(60));

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  family: 4,
})
.then(async () => {
  const db = mongoose.connection.db;

  // Get all collections
  const collections = await db.listCollections().toArray();

  let totalDocuments = 0;

  // For each collection, show count and sample documents
  for (const collection of collections) {
    const collectionName = collection.name;
    const count = await db.collection(collectionName).countDocuments();
    totalDocuments += count;

    console.log(`\n${collectionName.toUpperCase()}: ${count} documents`);

    // Show first 3 documents as examples (excluding sensitive fields)
    if (count > 0) {
      let limit = Math.min(3, count);
      const documents = await db.collection(collectionName)
        .find({})
        .limit(limit)
        .toArray();

      // Clean documents for display (remove sensitive fields and truncate)
      const cleanedDocs = documents.map(doc => {
        // Create a copy to avoid modifying original
        const cleanDoc = { ...doc };
        // Remove _id for cleaner display
        delete cleanDoc._id;
        // Remove potentially sensitive fields
        delete cleanDoc.passwordHash;
        delete cleanDoc.pushTokens;
        // Truncate long strings for readability
        Object.keys(cleanDoc).forEach(key => {
          if (typeof cleanDoc[key] === 'string' && cleanDoc[key].length > 50) {
            cleanDoc[key] = cleanDoc[key].substring(0, 47) + '...';
          }
        });
        return cleanDoc;
      });

      console.log('  Sample documents:');
      cleanedDocs.forEach((doc, index) => {
        console.log(`    ${index + 1}.`, JSON.stringify(doc, null, 4).replace(/\n/g, '\n      '));
      });

      if (count > 3) {
        console.log(`    ... and ${count - 3} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL DOCUMENTS: ${totalDocuments}`);
  console.log('='.repeat(60));

  // Close connection
  await mongoose.disconnect();

})
.catch(err => {
  console.error('Error previewing database:');
  console.error(err);
  process.exit(1);
});