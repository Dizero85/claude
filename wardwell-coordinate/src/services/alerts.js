// Real email alerting with a console/DB fallback. If SMTP isn't configured
// (the default — see .env.example), alerts are still recorded (the caller
// persists them to the notifications table) but no email is sent, and we
// log to the console instead. This lets the whole pilot run with zero
// external setup, and flipping to real email is just filling in SMTP_* .
import nodemailer from 'nodemailer';
import { config } from '../config.js';

function buildTransport() {
  if (!config.smtp.host) return null;
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}

const transport = buildTransport();

/**
 * @returns {Promise<{sentVia: 'email'|'log', error?: string}>}
 */
export async function sendAlert({ subject, text, ward }) {
  const line = `[ALERT]${ward ? ` (${ward.name})` : ''} ${subject} — ${text}`;
  if (!transport || !config.alertTo) {
    console.log(line);
    return { sentVia: 'log' };
  }
  try {
    await transport.sendMail({
      from: config.alertFrom,
      to: config.alertTo,
      subject: `Wardwell Coordinate: ${subject}`,
      text,
    });
    return { sentVia: 'email' };
  } catch (err) {
    console.error(`${line} (email send FAILED: ${err.message})`);
    return { sentVia: 'log', error: err.message };
  }
}

export function isEmailConfigured() {
  return !!(transport && config.alertTo);
}
