import { calculateSessionTimes, syncTaskReminder, cancelTaskReminder, processDueReminders } from "../src/lib/reminderScheduler";
import { renderSessionReminderEmail, sendEmail } from "../src/lib/email";
import { db } from "../src/lib/db";

async function runTestSuite() {
  console.log("=== STARTING GMAIL STUDY SESSION REMINDER TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Time Calculation & 1-hour before rule
  console.log("Scenario 1: 1-hour before session calculation & timezone support");
  const testDate = new Date("2026-11-06T00:00:00.000Z");
  const times = calculateSessionTimes(testDate, "10:00 AM", "UTC");
  assert(times !== null, "calculateSessionTimes parsed valid date and time string");
  if (times) {
    assert(times.sessionStartTime.getHours() === 10, "Session start time hour is 10");
    assert(times.reminderTime.getHours() === 9, "Reminder time is exactly 1 hour before (9:00 AM)");
    const diffHours = (times.sessionStartTime.getTime() - times.reminderTime.getTime()) / (1000 * 60 * 60);
    assert(diffHours === 1, "Time difference between session start and reminder is exactly 1 hour");
  }

  // 2. No reminder if date or time is missing
  console.log("\nScenario 2: Session without date/time receives no reminder");
  const nullTimes1 = calculateSessionTimes(null, "10:00 AM");
  const nullTimes2 = calculateSessionTimes(testDate, null);
  assert(nullTimes1 === null, "Missing dueDate returns null");
  assert(nullTimes2 === null, "Missing dueTime returns null");

  // 3. Email HTML & Text Rendering
  console.log("\nScenario 3: HTML and Plain-Text Email Template generation");
  const email = renderSessionReminderEmail({
    userName: "Priyanka",
    topic: "JavaScript Closures",
    dateStr: "November 6, 2026",
    timeStr: "10:00 AM",
  });
  assert(email.subject.includes("JavaScript Closures") || email.subject.includes("Starts in 1 Hour"), "Subject line is correct");
  assert(email.html.includes("JavaScript Closures"), "HTML body includes Topic");
  assert(email.html.includes("10:00 AM"), "HTML body includes Start Time");
  assert(email.html.includes("November 6, 2026"), "HTML body includes Date");
  assert(email.html.includes("Priyanka"), "HTML body includes personalized greeting");
  assert(email.text.includes("JavaScript Closures"), "Text version matches content");

  // 4. Database Lifecycle Integration & Idempotency
  console.log("\nScenario 4: Task Lifecycle Synchronization & Idempotency");
  const user = await db.user.findFirst();
  if (user) {
    // A. Create scheduled task (tomorrow at 10 AM)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const task = await db.task.create({
      data: {
        userId: user.id,
        title: "Test Session: JavaScript Closures",
        status: "TODO",
        dueDate: tomorrow,
        dueTime: "10:00 AM",
      },
    });

    await syncTaskReminder(task.id);

    const pendingReminders = await db.reminder.findMany({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(pendingReminders.length === 1, "Exactly 1 reminder scheduled for new session");

    // Test Idempotency: sync again shouldn't create duplicates
    await syncTaskReminder(task.id);
    const pendingAfterSync = await db.reminder.findMany({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(pendingAfterSync.length === 1, "Duplicate reminder prevented on repeated sync (Idempotency)");

    // B. Reschedule session time
    await db.task.update({
      where: { id: task.id },
      data: { dueTime: "02:00 PM" },
    });
    await syncTaskReminder(task.id);
    const updatedReminder = await db.reminder.findFirst({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(updatedReminder !== null && updatedReminder.scheduledFor !== null && updatedReminder.scheduledFor.getHours() === 14, "Reminder rescheduled to 2:00 PM session time");

    // C. Task Completion cancels reminder
    await db.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED" },
    });
    await syncTaskReminder(task.id);
    const completedReminders = await db.reminder.findMany({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(completedReminders.length === 0, "Pending reminder CANCELLED when task is marked COMPLETED");

    // D. Reopen task reschedules reminder
    await db.task.update({
      where: { id: task.id },
      data: { status: "TODO" },
    });
    await syncTaskReminder(task.id);
    const reopenedReminders = await db.reminder.findMany({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(reopenedReminders.length === 1, "Reminder re-scheduled when task is REOPENED");

    // E. Task Deletion cancels reminder
    await cancelTaskReminder(task.id);
    await db.task.delete({ where: { id: task.id } });
    const deletedReminders = await db.reminder.findMany({
      where: { taskId: task.id, status: "PENDING" },
    });
    assert(deletedReminders.length === 0, "Reminder CANCELLED upon task DELETION");

    // 5. Worker processing & simulation
    console.log("\nScenario 5: Background Worker Execution & Simulated Delivery");
    // Create a temporary due reminder
    const dueTask = await db.task.create({
      data: {
        userId: user.id,
        title: "Imminent Session: System Design",
        status: "TODO",
        dueDate: new Date(),
        dueTime: "11:00 AM",
      },
    });

    // Artificially create a reminder that is due right now
    const dummyReminder = await db.reminder.create({
      data: {
        taskId: dueTask.id,
        userId: user.id,
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
        remindAt: new Date(Date.now() - 1000), // Due 1 second ago
        status: "PENDING",
      },
    });

    const workerResult = await processDueReminders();
    assert(workerResult.sent >= 1, "Worker processed and sent due reminder");

    const sentReminder = await db.reminder.findUnique({
      where: { id: dummyReminder.id },
    });
    assert(sentReminder?.status === "SENT", "Reminder record updated to status SENT");
    assert(sentReminder?.isSent === true, "Reminder isSent flag set to true");
    assert(sentReminder?.sentAt !== null, "Reminder sentAt timestamp recorded");

    // Verify it won't be sent twice
    const secondPass = await processDueReminders();
    assert(secondPass.sent === 0, "Already sent reminder is NOT sent again (Deduplication)");

    // Cleanup test task
    await db.task.delete({ where: { id: dueTask.id } });
  }

  console.log(`\n==========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((e) => {
  console.error("Test suite runtime failure:", e);
  process.exit(1);
});
