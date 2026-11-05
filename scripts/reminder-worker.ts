import { processDueReminders } from "../src/lib/reminderScheduler";

const INTERVAL_MS = Number(process.env.REMINDER_POLL_INTERVAL_MS || 30000); // Check every 30 seconds

console.log("==========================================");
console.log("PulseTask Gmail Session Reminder Worker");
console.log(`Poll interval: ${INTERVAL_MS / 1000}s`);
console.log("Status: RUNNING");
console.log("==========================================");

let isRunning = false;

async function tick() {
  if (isRunning) return;
  isRunning = true;

  try {
    const res = await processDueReminders();
    if (res.processed > 0) {
      console.log(`[${new Date().toISOString()}] Reminders processed: ${res.processed} (Sent: ${res.sent}, Failed: ${res.failed}, Skipped: ${res.skipped})`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Worker tick error:`, err);
  } finally {
    isRunning = false;
  }
}

// Run immediately on boot
tick();

// Run periodically
setInterval(tick, INTERVAL_MS);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down reminder worker...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down reminder worker...");
  process.exit(0);
});
