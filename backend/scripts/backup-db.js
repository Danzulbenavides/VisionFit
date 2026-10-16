import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
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

// Safety check
if (!isLocalMongoDBUri()) {
  console.error('ERROR: Refusing to operate on remote/shared database for safety');
  process.exit(1);
}

// Check if mongodump is available
let mongodumpAvailable = false;
try {
  execSync('mongodump --version', { stdio: 'ignore' });
  mongodumpAvailable = true;
} catch (error) {
  mongodumpAvailable = false;
}

if (!mongodumpAvailable) {
  console.error('ERROR: mongodump command not found.');
  console.error('Please install MongoDB Database Tools:');
  console.error('- Download from: https://www.mongodb.com/try/download/database-tools');
  console.error('- Or use a package manager like chocolatey: choco install mongodb-database-tools');
  process.exit(1);
}

const dbName = getDatabaseName();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = resolve(__dirname, '../db-backups', `${dbName}-${timestamp}`);

// Create backup directory
if (!existsSync(dirname(backupDir))) {
  mkdirSync(dirname(backupDir), { recursive: true });
}

console.log(`Backing up database '${dbName}' to '${backupDir}'...`);

try {
  // Use mongodump to backup the database
  execSync(`mongodump --uri="${process.env.MONGODB_URI}" --out="${backupDir}"`, {
    stdio: 'inherit'
  });

  console.log(`\nBackup completed successfully!`);
  console.log(`Backup location: ${backupDir}`);
  console.log(`\nTo restore later, run:`);
  console.log(`mongorestore --uri="${process.env.MONGODB_URI}" "${backupDir}"`);

} catch (error) {
  console.error('Backup failed:');
  console.error(error.message);
  process.exit(1);
}