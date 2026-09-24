import "dotenv/config";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const backupDir = path.resolve("backups");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing from .env");
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

const outputFile = path.join(
  backupDir,
  `visionfit-backup-${timestamp}.archive.gz`,
);

console.log("Starting VisionFit MongoDB backup...");
console.log(`Backup file: ${outputFile}`);

const mongodump = spawn(
  "C:\\Users\\Denzel Art\\Downloads\\mongodb-database-tools-windows-x86_64-100.18.0\\bin\\mongodump.exe",
  [
    `--uri=${process.env.MONGODB_URI}`,
    "--db=visionfit",
    `--archive=${outputFile}`,
    "--gzip",
  ],
  {
    stdio: "inherit",
  },
);

mongodump.on("close", (code) => {
  if (code === 0) {
    console.log("VisionFit backup completed successfully.");
  } else {
    console.error(`Backup failed with exit code ${code}.`);
    process.exit(code || 1);
  }
});

mongodump.on("error", (error) => {
  console.error("Unable to start mongodump:", error.message);
  process.exit(1);
});
