import { db } from "@/lib/db";
import { sendEmail, renderSessionReminderEmail } from "@/lib/email";

/**
 * Calculates session start time from task's dueDate and dueTime.
 * E.g., dueDate: 2026-11-06T00:00:00Z, dueTime: "10:00" -> 2026-11-06T10:00:00 (local/user timezone parsed)
 */
export function calculateSessionTimes(
  dueDate: Date | string | null,
  dueTime: string | null | undefined,
  _userTimezone: string = "UTC"
): { sessionStartTime: Date; reminderTime: Date } | null {
  if (!dueDate || !dueTime) return null;

  const dateObj = typeof dueDate === "string" ? new Date(dueDate) : new Date(dueDate.getTime());
  if (isNaN(dateObj.getTime())) return null;

  // Format time (e.g. "10:00", "14:30", "10:00 AM")
  const timeRegex = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;
  const match = dueTime.trim().match(timeRegex);

  let hours = 0;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else {
    return null;
  }

  // Construct precise start time
  const sessionStartTime = new Date(dateObj);
  sessionStartTime.setHours(hours, minutes, 0, 0);

  // Exactly 1 hour before
  const reminderTime = new Date(sessionStartTime.getTime() - 60 * 60 * 1000);

  return { sessionStartTime, reminderTime };
}

/**
 * Synchronizes reminder when a task is created or updated.
 */
export async function syncTaskReminder(taskId: string): Promise<void> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            preferences: true,
          },
        },
      },
    });

    if (!task) return;

    // Rule: Cancel pending reminders if task is completed, archived, or lacks date/time
    const isInactive = task.status === "COMPLETED" || task.status === "ARCHIVED";
    if (isInactive || !task.dueDate || !task.dueTime) {
      await db.reminder.updateMany({
        where: { taskId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      return;
    }

    const timezone = task.user?.preferences?.timezone || "UTC";
    const times = calculateSessionTimes(task.dueDate, task.dueTime, timezone);

    if (!times) {
      await db.reminder.updateMany({
        where: { taskId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      return;
    }

    const now = new Date();

    // Rule: Do not send reminder if reminderTime is already in the past
    // (i.e., task created less than 1 hour before session or session is past)
    if (times.reminderTime.getTime() <= now.getTime()) {
      await db.reminder.updateMany({
        where: { taskId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      return;
    }

    // Cancel old pending reminders for this task to prevent duplicates
    await db.reminder.updateMany({
      where: {
        taskId,
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    });

    // Schedule new reminder
    await db.reminder.create({
      data: {
        taskId: task.id,
        userId: task.userId,
        scheduledFor: times.sessionStartTime,
        remindAt: times.reminderTime,
        status: "PENDING",
        isSent: false,
      },
    });
  } catch (err) {
    console.error(`syncTaskReminder error for task ${taskId}:`, err);
  }
}

/**
 * Cancels all pending reminders for a task (e.g. on deletion).
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await db.reminder.updateMany({
      where: { taskId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  } catch (err) {
    console.error(`cancelTaskReminder error for task ${taskId}:`, err);
  }
}

/**
 * Worker execution tick:
 * Finds all due pending reminders and dispatches emails with idempotency & retry logic.
 */
export async function processDueReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const now = new Date();

  // Find due reminders
  const dueReminders = await db.reminder.findMany({
    where: {
      status: "PENDING",
      isSent: false,
      remindAt: { lte: now },
    },
    include: {
      task: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              preferences: true,
            },
          },
        },
      },
    },
    take: 50,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of dueReminders) {
    // Atomic status transition to PROCESSING to prevent concurrent workers from claiming it
    const updated = await db.reminder.updateMany({
      where: {
        id: reminder.id,
        status: "PENDING",
      },
      data: { status: "PROCESSING" },
    });

    if (updated.count === 0) {
      skipped++;
      continue;
    }

    const task = reminder.task;

    // Validation checks before sending
    if (
      !task ||
      task.status === "COMPLETED" ||
      task.status === "ARCHIVED" ||
      !task.user?.email ||
      (task.user.preferences && !task.user.preferences.emailReminders)
    ) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "CANCELLED" },
      });
      skipped++;
      continue;
    }

    // Format human-friendly date and time
    const dateFormatted = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Upcoming";

    const timeFormatted = task.dueTime || "Scheduled Time";

    const emailContent = renderSessionReminderEmail({
      userName: task.user.name || "Student",
      topic: task.title,
      dateStr: dateFormatted,
      timeStr: timeFormatted,
    });

    const sendResult = await sendEmail({
      to: task.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (sendResult.success) {
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "SENT",
          isSent: true,
          sentAt: new Date(),
        },
      });

      // Also create an in-app notification
      await db.notification.create({
        data: {
          userId: task.userId,
          type: "REMINDER",
          title: "Study Session Starting Soon",
          message: `Your study session for "${task.title}" starts in 1 hour at ${timeFormatted}.`,
          linkUrl: `/tasks`,
        },
      });

      sent++;
    } else {
      const nextRetryCount = reminder.retryCount + 1;
      const isFinalFail = nextRetryCount >= 3;

      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          status: isFinalFail ? "FAILED" : "PENDING",
          retryCount: nextRetryCount,
          lastError: sendResult.error || "Unknown delivery error",
          // Backoff retry: 5 minutes later if retrying
          remindAt: isFinalFail ? reminder.remindAt : new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      failed++;
    }
  }

  return {
    processed: dueReminders.length,
    sent,
    failed,
    skipped,
  };
}

