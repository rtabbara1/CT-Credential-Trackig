import nodemailer from "nodemailer";

const GMAIL_USER     = process.env.OUTLOOK_USER;
const GMAIL_PASSWORD = process.env.OUTLOOK_PASSWORD;

const SUPERVISOR_EMAIL = "Raghda_Tabbara@atriushealth.org";
const MANAGER_EMAIL    = "Cheryl_Whyte@atriushealth.org";

const TECHS = [
  { firstName: "Karen",     lastName: "Calabro",     email: "Karen_Calabro@atriushealth.org",      arrt: "2026-07-31", stateLicense: "2027-08-31", bls: "2027-03-01" },
  { firstName: "Christina", lastName: "Desmond",     email: "Christina_Desmond@atriushealth.org",   arrt: "2026-07-31", stateLicense: "2027-08-31", bls: "2026-10-01" },
  { firstName: "Adam",      lastName: "Dykas",       email: "Adam_Dykas@atriushealth.org",          arrt: "2027-07-31", stateLicense: "2027-08-31", bls: "2027-05-01" },
  { firstName: "Anthony",   lastName: "Gattonini",   email: "Anthony_Gattonini@atriushealth.org",   arrt: "2026-08-31", stateLicense: "2027-09-30", bls: "2026-10-01" },
  { firstName: "Ibrahim",   lastName: "Haboub",      email: "Ibrahim_Haboub@atriushealth.org",      arrt: "2027-08-31", stateLicense: "2027-09-30", bls: "2027-06-01" },
  { firstName: "Stacey",    lastName: "Hurley",      email: "Stacey_Hurley@atriushealth.org",       arrt: "2027-05-31", stateLicense: "2027-06-30", bls: "2027-05-01" },
  { firstName: "Stacie",    lastName: "Joyce",       email: "Stacie_Joyce@atriushealth.org",        arrt: "2026-05-31", stateLicense: "2027-06-30", bls: "2028-02-01" },
  { firstName: "Mary",      lastName: "Mello",       email: "Mary_Mello@atriushealth.org",          arrt: "2026-07-31", stateLicense: "2027-08-31", bls: "2027-03-01" },
  { firstName: "Dona",      lastName: "Menutole",    email: "Dona_Menutole@atriushealth.org",       arrt: "2027-01-31", stateLicense: "2027-02-28", bls: "2028-03-01" },
  { firstName: "Kelley",    lastName: "Secord",      email: "Kelly_Secord@atriushealth.org",        arrt: "2027-10-31", stateLicense: "2027-11-30", bls: "2026-10-01" },
  { firstName: "Christine", lastName: "Sorrento",    email: "Christine_Sorrento@atriushealth.org",  arrt: "2026-10-31", stateLicense: "2027-11-30", bls: "2027-10-01" },
  { firstName: "Nancy",     lastName: "Spaulding",   email: "Nancy_Spaulding@atriushealth.org",     arrt: "2026-09-30", stateLicense: "2027-10-31", bls: "2027-03-01" },
  { firstName: "Kevin",     lastName: "Suslavicius", email: "Kevin_Suslavicius@atriushealth.org",   arrt: "2027-07-31", stat
    eLicense: "2027-08-31", bls: "2027-10-01" },
  { firstName: "Raghda",    lastName: "Tabbara",     email: "Raghda_Tabbara@atriushealth.org",      arrt: "2024-01-31", stateLicense: "2027-02-28", bls: "2026-09-30" },
  { firstName: "Mary",      lastName: "Thompson",    email: "Mary_Thompson@atriushealth.org",       arrt: "2026-10-31", stateLicense: "2027-11-30", bls: "2027-09-30" },
  { firstName: "Cheryl",    lastName: "Whyte",       email: "Cheryl_Whyte@atriushealth.org",        arrt: "2027-04-30", stateLicense: "2027-05-31", bls: "2026-12-01" },
];

const CREDENTIALS = [
  { key: "arrt",         label: "ARRT Certification" },
  { key: "stateLicense", label: "State License" },
  { key: "bls",          label: "BLS Certification" },
];

const REMINDER_DAYS = [30, 14, 7];

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp   = new Date(dateStr + "T00:00:00"); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - today) / 86400000);
}

function fmt(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function upcomingEmail(tech, label, exp, days) {
  const tag = days === 7 ? "FINAL NOTICE" : days === 14 ? "Urgent Reminder" : "Action Required";
  return {
    subject: `[${tag}] ${label} - ${tech.firstName} ${tech.lastName} (expires ${fmt(exp)})`,
    text: `Hi ${tech.firstName},\n\nYour ${label} expires in ${days} days on ${fmt(exp)}.\n\nPlease renew before the expiration date to remain compliant.\n\nThank you,\nCT Imaging Department`,
  };
}

function expiredEmail(tech, label, exp, daysOver) {
  const dw = daysOver === 1 ? "day" : "days";
  return {
    subject: `[EXPIRED - ${daysOver} ${dw} overdue] ${label} - ${tech.firstName} ${tech.lastName}`,
    text: `Hi ${tech.firstName},\n\nYour ${label} EXPIRED on ${fmt(exp)} - ${daysOver} ${dw} ago.\n\nPlease contact your supervisor immediately.\n\nThank you,\nCT Imaging Department`,
  };
}

function managerSummaryEmail(items) {
  const lines = items.map(({ tech, label, exp, daysOver }) => {
    const dw = daysOver === 1 ? "day" : "days";
    return `  - ${tech.firstName} ${tech.lastName} - ${label} (expired ${fmt(exp)}, ${daysOver} ${dw} ago)`;
  }).join("\n");
  return {
    subject: `[Daily Alert] ${items.length} Expired Credentials Require Attention`,
    text: `Hello,\n\nThe following credentials are EXPIRED:\n\n${lines}\n\nPlease follow up.\n\nThank you,\nCT Imaging Department`,
  };
}

async function main() {
  console.log("Starting CT Credential Reminder script...");
  console.log("Gmail user configured:", !!GMAIL_USER);
  console.log("Gmail password configured:", !!GMAIL_PASSWORD);

  if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.error("ERROR: Missing email credentials in GitHub Secrets.");
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASSWORD },
  });

  console.log("Testing SMTP connection...");
  try {
    await transport.verify();
    console.log("SMTP connection OK!");
  } catch (e) {
    console.error("SMTP connection FAILED:", e.message);
    process.exit(1);
  }

  const from = `CT Credentials Tracker <${GMAIL_USER}>`;
  const expired = [];
  let sent = 0, failed = 0;

  for (const tech of TECHS) {
    for (const { key, label } of CREDENTIALS) {
      const exp  = tech[key]; if (!exp) continue;
      const days = daysUntil(exp);
      const cc   = [SUPERVISOR_EMAIL, MANAGER_EMAIL].filter(e => e !== tech.email).join(", ");

      if (days <= 0) {
        const daysOver = Math.abs(days);
        expired.push({ tech, label, exp, daysOver });
        const { subject, text } = expiredEmail(tech, label, exp, daysOver);
        try {
          await transport.sendMail({ from, to: tech.email, cc: cc || undefined, subject, text });
          console.log(`SENT expired notice: ${tech.firstName} ${tech.lastName} | ${label}`);
          sent++;
        } catch (e) {
          console.error(`FAILED: ${tech.firstName} ${tech.lastName} | ${label} | ${e.message}`);
          failed++;
        }
      } else if (REMINDER_DAYS.includes(days)) {
        const { subject, text } = upcomingEmail(tech, label, exp, days);
        try {
          await transport.sendMail({ from, to: tech.email, cc: cc || undefined, subject, text });
          console.log(`SENT ${days}-day reminder: ${tech.firstName} ${tech.lastName} | ${label}`);
          sent++;
        } catch (e) {
          console.error(`FAILED: ${tech.firstName} ${tech.lastName} | ${label} | ${e.message}`);
          failed++;
        }
      }
    }
  }

  if (expired.length > 0) {
    const { subject, text } = managerSummaryEmail(expired);
    try {
      await transport.sendMail({ from, to: [SUPERVISOR_EMAIL, MANAGER_EMAIL].join(", "), subject, text });
      console.log(`Manager summary sent (${expired.length} expired)`);
    } catch (e) {
      console.error("Manager summary failed:", e.message);
    }
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed, ${expired.length} expired.`);
  if (failed > 0) process.exit(1);
}

main();
