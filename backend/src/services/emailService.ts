import { env } from '../config/env';

interface SendSurveyEmailOptions {
  supplierEmail: string;
  supplierName: string;
  surveyTitle: string;
  surveyToken: string;
}

/**
 * Sends a professional survey invitation email to a supplier.
 * Supports SMTP (Gmail App Password) and Resend API.
 */
export async function sendSurveyInvitation(opts: SendSurveyEmailOptions): Promise<boolean> {
  const surveyUrl = `${env.frontendUrl}/survey/${opts.surveyToken}`;

  // 1. Try Gmail / Custom SMTP if configured
  if (env.smtpUser && env.smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"SupplierAssess" <${env.smtpUser}>`,
        to: opts.supplierEmail,
        subject: `Survey Request: ${opts.surveyTitle}`,
        html: buildEmailHtml(opts.supplierName, opts.surveyTitle, surveyUrl),
      });

      console.log(`[Email SMTP] Survey invitation sent successfully to ${opts.supplierEmail}`);
      return true;
    } catch (error) {
      console.error(`[Email SMTP] Failed to send email to ${opts.supplierEmail}:`, error);
      return false;
    }
  }

  // 2. Fallback to Resend API
  if (!env.resendApiKey || env.resendApiKey.startsWith('re_replace')) {
    console.warn('[Email] Neither SMTP nor RESEND_API_KEY is configured — skipping email send.');
    return false;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(env.resendApiKey);

    const { error } = await resend.emails.send({
      from: env.emailFrom || 'onboarding@resend.dev',
      to: opts.supplierEmail,
      subject: `Survey Request: ${opts.surveyTitle}`,
      html: buildEmailHtml(opts.supplierName, opts.surveyTitle, surveyUrl),
    });

    if (error) {
      console.error('[Email Resend] Failed to send survey invitation:', error);
      return false;
    }

    console.log(`[Email Resend] Survey invitation sent to ${opts.supplierEmail}`);
    return true;
  } catch (err) {
    console.error('[Email Resend] Unexpected error:', err);
    return false;
  }
}

function buildEmailHtml(supplierName: string, surveyTitle: string, surveyUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background-color:#4f63d2;padding:28px 40px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">SupplierAssess</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Supplier Assessment Portal</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Supplier Survey Request</h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${supplierName},</p>
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
            You have been invited to complete the following assessment survey. This helps us evaluate supplier performance and improve our working relationship.
          </p>

          <!-- Survey Info Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-radius:6px;border:1px solid #c7d7fe;margin-bottom:28px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#4f63d2;">Survey</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1e2a6e;">${surveyTitle}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Please click the button below to open the survey. No login is required — the link is unique and secure to you.
          </p>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background-color:#4f63d2;border-radius:6px;">
              <a href="${surveyUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                Open Survey →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${surveyUrl}" style="color:#4f63d2;word-break:break-all;">${surveyUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            This email was sent by SupplierAssess. If you have questions, contact your procurement team.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
