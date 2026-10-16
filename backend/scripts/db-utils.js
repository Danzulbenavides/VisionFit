// Utility functions for database operations with safety checks

/**
 * Checks if the MongoDB URI is safe to operate on (local only)
 * @returns {boolean} true if URI is localhost/local, false if remote/shared
 */
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

/**
 * Gets the database name from MongoDB URI
 * @returns {string} database name
 */
function getDatabaseName() {
  const uri = process.env.MONGODB_URI;
  // Extract database name from URI like mongodb://host:port/dbname?options...
  const match = uri.match(/\/([^?]+)/);
  return match ? match[1] : 'visionfit'; // fallback
}

module.exports = {
  isLocalMongoDBUri,
  getDatabaseName
};