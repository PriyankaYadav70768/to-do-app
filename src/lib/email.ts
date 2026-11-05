import nodemailer, { type Transporter } from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = port === 465;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Development / fallback logger transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  try {
    const fromAddress = process.env.GMAIL_USER || process.env.EMAIL_FROM || "PulseTask <noreply@pulsetask.app>";
    const transport = getEmailTransporter();

    const isSimulated = !process.env.GMAIL_USER && !process.env.EMAIL_USER;

    const info = await transport.sendMail({
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (isSimulated) {
      console.log(`[Email Simulation] Sent to: ${payload.to} | Subject: ${payload.subject}`);
      return { success: true, messageId: "simulated-" + Date.now(), simulated: true };
    }

    return { success: true, messageId: info.messageId, simulated: false };
  } catch (err: any) {
    console.error("sendEmail error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export function renderSessionReminderEmail(params: {
  userName: string;
  topic: string;
  dateStr: string;
  timeStr: string;
  appUrl?: string;
}): { subject: string; html: string; text: string } {
  const { userName, topic, dateStr, timeStr, appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://to-do-app-bay-eta-47.vercel.app" } = params;

  const subject = `Reminder: Your Study Session Starts in 1 Hour!`;

  const text = `Hello ${userName},

This is a friendly reminder about your upcoming study session.

Your scheduled topic: ${topic}
Start Time: ${timeStr}
Date: ${dateStr}

You have one hour left before your study session begins.
Get ready and stay focused!

Open Workspace: ${appUrl}/tasks

Happy Learning!
PulseTask Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; color: #e2e8f0; margin-bottom: 20px; font-weight: 500; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
    .field:last-child { border-bottom: none; }
    .field-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .field-value { font-size: 14px; color: #f8fafc; font-weight: 600; text-align: right; }
    .badge { display: inline-block; padding: 4px 10px; background-color: #3b82f6; color: #ffffff; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .timer-alert { background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #93c5fd; }
    .cta-container { text-align: center; margin: 32px 0 20px; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 13px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); }
    .footer { border-top: 1px solid #1e293b; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; background-color: #0b1120; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: inline-block; width: 40px; height: 40px; background: rgba(255, 255, 255, 0.15); border-radius: 10px; margin-bottom: 12px; line-height: 40px; font-size: 20px;">⚡</div>
      <h1>PulseTask Study Reminder</h1>
      <p>Your session begins in exactly 1 hour</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
        This is a friendly reminder about your upcoming scheduled study session.
      </p>

      <div class="card">
        <div style="margin-bottom: 12px;">
          <span class="badge">Study Session</span>
        </div>
        <div class="field">
          <span class="field-label">Topic</span>
          <span class="field-value">${topic}</span>
        </div>
        <div class="field">
          <span class="field-label">Date</span>
          <span class="field-value">${dateStr}</span>
        </div>
        <div class="field">
          <span class="field-label">Start Time</span>
          <span class="field-value">${timeStr}</span>
        </div>
      </div>

      <div class="timer-alert">
        ⏳ <strong>You have one hour left</strong> before your study session begins. Get your workspace ready and stay focused!
      </div>

      <div class="cta-container">
        <a href="${appUrl}/tasks" class="cta-btn">Open PulseTask Workspace &rarr;</a>
      </div>

      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 24px;">
        Happy Learning!
      </p>
    </div>

    <div class="footer">
      &copy; 2026 PulseTask. All rights reserved.<br>
      You received this email because you scheduled a reminder for your study task.
    </div>
  </div>
</body>
</html>
`;

  return { subject, html, text };
}
