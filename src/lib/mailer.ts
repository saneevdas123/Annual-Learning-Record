import path from 'path';
import nodemailer from 'nodemailer';
import { EMAIL_LOGO_CID } from '@/lib/emailTemplates';

export {
  credentialsEmail,
  recordSubmittedEmail,
  recordDecisionEmail,
  appealFiledEmail,
  appealResolvedEmail,
  yearSignedEmail,
} from '@/lib/emailTemplates';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('[mailer] SMTP not configured — emails will be logged, not sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function logoAttachment() {
  return {
    filename: 'cutm-logo.png',
    path: path.join(process.cwd(), 'public', 'cutm-logo.png'),
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline' as const,
  };
}

/**
 * Send a single email. If SMTP is not configured the payload is logged so the
 * platform keeps working in development (fail-soft).
 * CUTM logo is attached inline so the header mark shows even without a public URL.
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || 'CUTM ALR <no-reply@cutm.ac.in>';
  if (!t) {
    console.log(`[mailer:dryrun] TO=${to} SUBJECT=${subject}`);
    return { accepted: Array.isArray(to) ? to : [to], dryRun: true };
  }
  const payload = { from, to, subject, html, text };
  const wantsLogo = true;
  try {
    return await t.sendMail({
      ...payload,
      attachments: [logoAttachment()],
    });
  } catch (e) {
    if (wantsLogo) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('[mailer] send with logo failed, retrying without attachment:', message);
      return t.sendMail(payload);
    }
    throw e;
  }
}

export async function sendMailSafe(opts: {
  to: string | string[] | null | undefined;
  subject: string;
  html: string;
  text: string;
}) {
  if (!opts.to) return;
  try {
    await sendMail({ to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[mailer] send failed:', message);
  }
}
