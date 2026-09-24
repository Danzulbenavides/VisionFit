import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const backupDir = path.resolve("backups");

const backupFiles = fs
  .readdirSync(backupDir)
  .filter((file) => file.endsWith(".archive.gz"))
  .sort()
  .reverse();

if (backupFiles.length === 0) {
  console.error("No .archive.gz backup file found.");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing from .env");
  process.exit(1);
}

const backupFile = path.join(backupDir, backupFiles[0]);

const mongorestorePath =
  "C:\\Users\\Denzel Art\\Downloads\\mongodb-database-tools-windows-x86_64-100.18.0\\bin\\mongorestore.exe";

console.log("Starting VisionFit recovery test...");
console.log(`Backup file: ${backupFile}`);
console.log("Target database: visionfit_recovery_test");

const restore = spawn(
  mongorestorePath,
  [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${backupFile}`,
    "--gzip",
    "--nsFrom=visionfit.*",
    "--nsTo=visionfit_recovery_test.*",
  ],
  {
    stdio: "inherit",
  },
);

restore.on("close", (code) => {
  if (code === 0) {
    console.log("VisionFit recovery test completed successfully.");
  } else {
    console.error(`Recovery failed with exit code ${code}.`);
    process.exit(code || 1);
  }
});

restore.on("error", (error) => {
  console.error("Unable to start mongorestore:", error.message);
  process.exit(1);
});
