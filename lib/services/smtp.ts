import "server-only";

import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SmtpSettings } from "@/types";

/**
 * Service to manage SMTP configuration and email dispatch.
 *
 * SMTP credentials (host, port, user, app password, etc.) are stored directly
 * in the database `system_settings` table so the Super Admin can change them
 * at any time from the UI without redeploying code or re-configuring Vercel env vars.
 * Falls back to process.env if DB rows have not been configured yet.
 */

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", [
      "smtp_host",
      "smtp_port",
      "smtp_user",
      "smtp_pass",
      "smtp_from_name",
      "smtp_secure",
      "smtp_enabled",
    ]);

  const map: Record<string, string> = {};
  if (rows) {
    for (const r of rows) {
      if (r.key) map[r.key] = r.value ?? "";
    }
  }

  const host = map.smtp_host || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(map.smtp_port || process.env.SMTP_PORT || "587", 10) || 587;
  const user = map.smtp_user || process.env.EMAIL_USER || "";
  const pass = map.smtp_pass || process.env.EMAIL_PASS || "";
  const fromName = map.smtp_from_name || process.env.EMAIL_FROM_NAME || "DESCO Smart";
  const secure = map.smtp_secure ? map.smtp_secure === "true" : port === 465;
  const enabled = map.smtp_enabled !== undefined ? map.smtp_enabled === "true" : true;

  return {
    host,
    port,
    user,
    pass,
    fromName,
    secure,
    enabled,
    configured: Boolean(user && pass),
  };
}

export async function saveSmtpSettings(settings: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  secure: boolean;
  enabled: boolean;
}): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const updates = [
    { key: "smtp_host", value: settings.host.trim() },
    { key: "smtp_port", value: String(settings.port) },
    { key: "smtp_user", value: settings.user.trim() },
    { key: "smtp_pass", value: settings.pass.trim() },
    { key: "smtp_from_name", value: settings.fromName.trim() },
    { key: "smtp_secure", value: String(settings.secure) },
    { key: "smtp_enabled", value: String(settings.enabled) },
  ];

  for (const item of updates) {
    await supabase.from("system_settings").upsert(
      {
        key: item.key,
        value: item.value,
        description: `SMTP configuration: ${item.key}`,
        updated_at: now,
      },
      { onConflict: "key" },
    );
  }
}

/**
 * Creates a configured Nodemailer transporter using active DB credentials.
 */
export async function createSmtpTransporter() {
  const config = await getSmtpSettings();
  if (!config.configured || !config.enabled) {
    throw new Error("SMTP is not configured or is currently disabled in system settings.");
  }

  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for 587
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        // Do not fail on invalid certs in internal test setups
        rejectUnauthorized: false,
      },
    }),
    config,
  };
}

/**
 * Sends a real test email to verify credentials and SMTP handshake.
 */
export async function testSmtpConnection(
  targetEmail: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const { transporter, config } = await createSmtpTransporter();

    // Verify connection configuration first
    await transporter.verify();

    const fromAddress = `"${config.fromName}" <${config.user}>`;
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      subject: `[DESCO Smart] Live SMTP Test - Connection Successful`,
      text: `Hello,\n\nThis is a verification test email from DESCO Smart Executive Control.\n\nYour SMTP gateway is working properly!\nSender: ${config.user}\nHost: ${config.host}:${config.port}\nTime: ${timestamp} (Asia/Dhaka)\n\nThank you for using DESCO Smart!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #059669; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">DESCO Smart — SMTP Gateway Active</h1>
          </div>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello,</p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            This is a live test email verifying that your <strong>DESCO Smart</strong> email delivery settings and Google App Password are fully functional.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #64748b; padding: 6px 0;"><strong>Sender Mail:</strong></td>
                <td style="color: #0f172a; padding: 6px 0;">${config.user}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;"><strong>SMTP Relay:</strong></td>
                <td style="color: #0f172a; padding: 6px 0;">${config.host}:${config.port} (SSL: ${config.secure ? "Yes" : "STARTTLS"})</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;"><strong>Status:</strong></td>
                <td style="color: #059669; font-weight: 600; padding: 6px 0;">✓ Verified & Delivering</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;"><strong>Dispatch Time:</strong></td>
                <td style="color: #0f172a; padding: 6px 0;">${timestamp}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
            Whenever a meter balance falls below its custom alert threshold, automatic notifications will be sent to the meter's designated alert email address using this gateway.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            DESCO Smart Automated Monitoring System · Bangladesh
          </p>
        </div>
      `,
    });

    return {
      ok: true,
      message: `Test email sent successfully! Message ID: ${info.messageId}`,
    };
  } catch (err: unknown) {
    console.error("[smtp] Test email dispatch failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to establish SMTP handshake with mail server.";
    return {
      ok: false,
      message,
    };
  }
}
