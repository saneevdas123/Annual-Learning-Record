import { ROLE_LABELS } from '@/lib/domain';
import { getSiteUrl, SITE } from '@/lib/site';

export const EMAIL_LOGO_CID = 'cutm-logo@cutm';

const INK = '#141414';
const CREAM = '#FDF8F0';
const BRAND = '#FF4B3E';
const MUTED = '#5c574e';

const ROLE_BLURB: Record<string, string> = {
  ADMIN: 'You can set up campuses, add people, and open the full learning-record register.',
  DEAN: 'You can follow learning records and evaluations across your campus.',
  HOD: 'You can sign off records in your department and complete year-wise evaluations.',
  FACULTY: 'You can review submitted records for the courses you teach.',
  MENTOR: 'You can sign the mentor step for your mentees’ learning records.',
  STUDENT: 'You can file course learning records, follow sign-off, and see your ALR credit.',
};

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function httpUrl(value: unknown) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  return raw;
}

function logoSrc() {
  return `cid:${EMAIL_LOGO_CID}`;
}

function metaRow(label: string, valueHtml: string) {
  if (!valueHtml) return '';
  return `
    <tr>
      <td class="email-meta-label" style="padding:10px 0;border-bottom:1px solid rgba(20,20,20,0.08);width:34%;vertical-align:top;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};">
        ${esc(label)}
      </td>
      <td class="email-meta-value" style="padding:10px 0;border-bottom:1px solid rgba(20,20,20,0.08);vertical-align:top;font-size:15px;line-height:1.45;color:${INK};font-weight:600;">
        ${valueHtml}
      </td>
    </tr>`;
}

function ctaButton(href: string, label: string) {
  const url = httpUrl(href);
  if (!url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-btn-wrap" style="margin:0 0 8px 0;">
      <tr>
        <td bgcolor="${BRAND}" class="email-btn-td" style="background:${BRAND};border:2px solid ${INK};border-radius:999px;">
          <a href="${esc(url)}" class="email-btn" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${esc(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function ghostLink(href: string, label: string) {
  const url = httpUrl(href);
  if (!url) return '';
  return `<a href="${esc(url)}" style="color:${BRAND};font-weight:700;text-decoration:none;word-break:break-all;">${esc(label)}</a>`;
}

/**
 * Shared CUTM letter — cream page, ink frame, official logo.
 * Table layout + a small media query so phones, tablets, and laptops stay readable.
 * Visual shell matches Mentor-Mentee exactly (INK / CREAM / BRAND tokens).
 */
function brandedEmail({
  preheader,
  eyebrow,
  heading,
  bodyHtml,
}: {
  preheader: string;
  eyebrow?: string;
  heading: string;
  bodyHtml: string;
}) {
  const site = getSiteUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(heading)}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; }
    body { background: ${CREAM}; }
    a { color: ${BRAND}; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 22px 18px !important; }
      .email-head { padding: 18px 18px 16px !important; }
      .email-title { font-size: 22px !important; line-height: 1.25 !important; }
      .email-btn-wrap, .email-btn-td, .email-btn { width: 100% !important; }
      .email-btn { text-align: center !important; box-sizing: border-box !important; }
      .email-logo { width: 40px !important; height: auto !important; }
      .email-meta-label, .email-meta-value {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .email-meta-label { padding-bottom: 2px !important; border-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${esc(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
    <tr>
      <td align="center" style="padding:20px 12px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-shell" style="width:600px;max-width:600px;background:#ffffff;border:2px solid ${INK};">
          <tr>
            <td class="email-head" bgcolor="${INK}" style="background:${INK};padding:20px 24px 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="56" valign="middle" style="width:56px;padding-right:12px;">
                    <div style="background:${CREAM};border:1px solid rgba(253,248,240,0.28);padding:6px;">
                      <img src="${logoSrc()}" class="email-logo" width="44" alt="Centurion University" style="display:block;width:44px;height:auto;" />
                    </div>
                  </td>
                  <td valign="middle">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};">
                      CUTM
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;line-height:1.2;color:${CREAM};padding-top:2px;">
                      ${esc(SITE.name)}
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.35;color:rgba(253,248,240,0.72);padding-top:3px;">
                      ${esc(SITE.orgShort)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td height="4" bgcolor="${BRAND}" style="background:${BRAND};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;color:${INK};">
              ${eyebrow ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND};margin:0 0 8px;">${esc(eyebrow)}</div>` : ''}
              <h1 class="email-title" style="margin:0 0 18px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${INK};">
                ${esc(heading)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:8px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:${MUTED};">
              ALR Cell<br />
              ${esc(SITE.org)}
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${CREAM}" style="background:${CREAM};padding:16px 28px 18px;border-top:2px solid ${INK};font-family:Arial,Helvetica,sans-serif;">
              <div style="padding-bottom:10px;">
                <img src="${logoSrc()}" width="36" alt="CUTM" style="display:block;width:36px;height:auto;" />
              </div>
              <div style="font-size:12px;line-height:1.5;color:${MUTED};">
                Automated mail from ${esc(SITE.appName)}. Please do not reply to this address.
              </div>
              <div style="font-size:12px;line-height:1.5;color:${MUTED};padding-top:6px;">
                <a href="${esc(site)}" style="color:${INK};font-weight:700;text-decoration:none;">${esc(site.replace(/^https?:\/\//, ''))}</a>
                &nbsp;·&nbsp;© ${year} CUTM
              </div>
              <div style="font-size:11px;font-style:italic;color:${MUTED};padding-top:8px;">
                Shaping Lives · Empowering Communities
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(html: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};">${html}</p>`;
}

function note(html: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 18px;">
      <tr>
        <td style="background:${CREAM};border:1px solid rgba(20,20,20,0.12);padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${INK};">
          ${html}
        </td>
      </tr>
    </table>`;
}

function detailsTable(rows: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 20px;">
      ${rows}
    </table>`;
}

export function credentialsEmail({
  name,
  email,
  tempPassword,
  role,
  loginUrl,
}: {
  name?: string;
  email: string;
  tempPassword: string;
  role: string;
  loginUrl?: string;
}) {
  const roleLabel = ROLE_LABELS[role] || role || 'Member';
  const blurb = ROLE_BLURB[role] || 'Sign in to the CUTM ALR platform with the details below.';
  const login = httpUrl(loginUrl) || `${getSiteUrl()}/login`;

  const bodyHtml = [
    p(`Hello ${esc(name || 'there')},`),
    p(`An account is ready for you as <strong>${esc(roleLabel)}</strong>. ${esc(blurb)}`),
    detailsTable([metaRow('Sign-in', ghostLink(login, login)), metaRow('Email', esc(email))].join('')),
    `<div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin:0 0 8px;">Temporary password</div>`,
    `<div style="font-family:Consolas,'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:0.04em;color:${INK};background:${CREAM};border:2px solid ${INK};padding:12px 14px;margin:0 0 16px;word-break:break-all;">${esc(tempPassword)}</div>`,
    note('On first sign-in you will be asked to choose your own password. Do not share this mail.'),
    ctaButton(login, 'Open sign-in'),
  ].join('');

  const text = [
    `Hello ${name || 'there'},`,
    '',
    `An account is ready for you as ${roleLabel}.`,
    blurb,
    '',
    `Sign-in: ${login}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    'Change this password on first sign-in. Do not share this mail.',
    '',
    'ALR Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM ALR — ${roleLabel} sign-in`,
    html: brandedEmail({
      preheader: `Sign in as ${roleLabel}. Change the temporary password on first login.`,
      eyebrow: 'Account',
      heading: 'Your sign-in details',
      bodyHtml,
    }),
    text,
  };
}

export function recordSubmittedEmail({
  reviewerName,
  studentName,
  title,
  courseLabel,
  dashboardUrl,
}: {
  reviewerName?: string;
  studentName: string;
  title: string;
  courseLabel: string;
  dashboardUrl?: string;
}) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/review`;

  const bodyHtml = [
    p(`Hello ${esc(reviewerName || 'there')},`),
    p(`<strong>${esc(studentName)}</strong> submitted a learning record that is waiting on your sign-off.`),
    detailsTable(
      [metaRow('Student', esc(studentName)), metaRow('Record', esc(title)), metaRow('Course', esc(courseLabel))].join('')
    ),
    note('Review the evidence, score if you are faculty, then approve, return, or reject from the queue.'),
    ctaButton(dash, 'Open review queue'),
  ].join('');

  const text = [
    `Hello ${reviewerName || 'there'},`,
    '',
    `${studentName} submitted "${title}" (${courseLabel}).`,
    `Open: ${dash}`,
    '',
    'ALR Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM ALR — record submitted for review`,
    html: brandedEmail({
      preheader: `${studentName} submitted "${title}".`,
      eyebrow: 'Review',
      heading: 'A record is waiting on you',
      bodyHtml,
    }),
    text,
  };
}

export function recordDecisionEmail({
  studentName,
  title,
  decision,
  noteText,
  dashboardUrl,
}: {
  studentName?: string;
  title: string;
  decision: string;
  noteText?: string;
  dashboardUrl?: string;
}) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/records`;
  const heading =
    decision === 'APPROVED'
      ? 'Your record was approved'
      : decision === 'REVISION'
        ? 'Your record needs revision'
        : decision === 'REJECTED'
          ? 'Your record was returned'
          : 'Your record moved forward';

  const bodyHtml = [
    p(`Hello ${esc(studentName || 'there')},`),
    p(`A reviewer updated <strong>${esc(title)}</strong>.`),
    detailsTable(
      [metaRow('Record', esc(title)), metaRow('Status', esc(decision.replace(/_/g, ' '))), noteText ? metaRow('Note', esc(noteText)) : ''].join('')
    ),
    ctaButton(dash, 'Open the record'),
  ].join('');

  const text = [
    `Hello ${studentName || 'there'},`,
    '',
    `Update on "${title}": ${decision}.`,
    noteText ? `Note: ${noteText}` : '',
    `Open: ${dash}`,
    '',
    'ALR Cell, Centurion University',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `CUTM ALR — ${title}`,
    html: brandedEmail({
      preheader: `${title} · ${decision}`,
      eyebrow: 'Learning record',
      heading,
      bodyHtml,
    }),
    text,
  };
}

export function appealFiledEmail({
  reviewerName,
  studentName,
  title,
  reason,
  dashboardUrl,
}: {
  reviewerName?: string;
  studentName: string;
  title: string;
  reason: string;
  dashboardUrl?: string;
}) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/review`;

  const bodyHtml = [
    p(`Hello ${esc(reviewerName || 'there')},`),
    p(`<strong>${esc(studentName)}</strong> appealed the score on a learning record.`),
    detailsTable([metaRow('Student', esc(studentName)), metaRow('Record', esc(title)), metaRow('Reason', esc(reason))].join('')),
    note('Uphold with a new score or deny the appeal from the record page.'),
    ctaButton(dash, 'Open the record'),
  ].join('');

  const text = [
    `Hello ${reviewerName || 'there'},`,
    '',
    `${studentName} appealed "${title}".`,
    `Reason: ${reason}`,
    `Open: ${dash}`,
    '',
    'ALR Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM ALR — score appeal filed`,
    html: brandedEmail({
      preheader: `${studentName} appealed "${title}".`,
      eyebrow: 'Appeal',
      heading: 'A student appealed a score',
      bodyHtml,
    }),
    text,
  };
}

export function appealResolvedEmail({
  studentName,
  title,
  decision,
  dashboardUrl,
}: {
  studentName?: string;
  title: string;
  decision: string;
  dashboardUrl?: string;
}) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/records`;
  const label = decision === 'UPHELD' ? 'upheld' : 'denied';

  const bodyHtml = [
    p(`Hello ${esc(studentName || 'there')},`),
    p(`Your appeal on <strong>${esc(title)}</strong> was ${esc(label)}.`),
    detailsTable([metaRow('Record', esc(title)), metaRow('Decision', esc(label))].join('')),
    ctaButton(dash, 'View the record'),
  ].join('');

  const text = [
    `Hello ${studentName || 'there'},`,
    '',
    `Your appeal on "${title}" was ${label}.`,
    `Open: ${dash}`,
    '',
    'ALR Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM ALR — appeal ${label}`,
    html: brandedEmail({
      preheader: `Your appeal on "${title}" was ${label}.`,
      eyebrow: 'Appeal',
      heading: decision === 'UPHELD' ? 'Your appeal was upheld' : 'Your appeal was denied',
      bodyHtml,
    }),
    text,
  };
}

export function yearSignedEmail({
  studentName,
  academicYear,
  dashboardUrl,
}: {
  studentName?: string;
  academicYear: string;
  dashboardUrl?: string;
}) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/credits`;

  const bodyHtml = [
    p(`Hello ${esc(studentName || 'there')},`),
    p(`Your ${esc(academicYear)} annual learning record was signed off and <strong>1 compulsory-basket credit</strong> was posted.`),
    detailsTable([metaRow('Year', esc(academicYear)), metaRow('Credit', '1 ALR credit')].join('')),
    ctaButton(dash, 'Open credit ledger'),
  ].join('');

  const text = [
    `Hello ${studentName || 'there'},`,
    '',
    `Your ${academicYear} learning record was signed off. 1 credit was posted.`,
    `Open: ${dash}`,
    '',
    'ALR Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM ALR — ${academicYear} record signed off`,
    html: brandedEmail({
      preheader: `Your ${academicYear} learning record was signed off.`,
      eyebrow: 'Credit',
      heading: 'Your year was signed off',
      bodyHtml,
    }),
    text,
  };
}
