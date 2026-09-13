/**
 * Email service for sending magic link emails
 * Uses Resend for reliable email delivery in serverless environments
 
 */

import { Resend } from 'resend';
import { COMPANY_ADDRESS, COMPANY_NAME } from '../shared/const';

const emailCompanyFooter = `${COMPANY_NAME} · ${COMPANY_ADDRESS}`;

export interface MagicLinkEmailData {
  to: string;
  name: string;
  magicLink: string;
  expiresInMinutes: number;
}

export interface ContactEmailData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  phone?: string;
}

export interface ProjectInquiryEmailData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  description: string;
}

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  // Always log configuration check (important for production debugging)
  console.log('[Email] Resend configuration check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  if (!apiKey) {
    console.error('[Email] CRITICAL: Resend API key not configured. Emails will not be sent.');
    return null;
  }

  try {
    const resend = new Resend(apiKey);
    console.log('[Email] Resend client initialized successfully');
    return resend;
  } catch (error) {
    console.error('[Email] CRITICAL: Failed to initialize Resend client:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export async function sendMagicLinkEmail(data: MagicLinkEmailData): Promise<void> {
  const resend = getResendClient();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Always use verified domain noreply@hopstecinnovation.com
  // Domain must be verified in Resend: https://resend.com/domains
  const fromEmail = 'noreply@hopstecinnovation.com';

  console.log('[Email] sendMagicLinkEmail called:', {
    to: data.to,
    hasResendClient: !!resend,
    isDevelopment,
    fromEmail,
  });

  if (!resend) {
    // In development, just log the magic link so local testing still works.
    if (isDevelopment) {
      console.log('\n==============================================');
      console.log('🔐 MAGIC LINK (Development Mode)');
      console.log('==============================================');
      console.log(`To: ${data.to}`);
      console.log(`Name: ${data.name}`);
      console.log(`Link: ${data.magicLink}`);
      console.log(`Expires in: ${data.expiresInMinutes} minutes`);
      console.log('==============================================\n');
      return;
    }

    // In production, never pretend the email was sent — clients would get stuck.
    throw new Error(
      'Email delivery is not configured. Please contact Hopstec support or try again later.'
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to ${COMPANY_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #070b12;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b12; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0c121c; border-radius: 16px; overflow: hidden; border: 1px solid #ffffff18;">
              <tr>
                <td style="background-color: #0a101a; padding: 36px 30px; text-align: center; border-bottom: 1px solid #ffffff14;">
                  <div style="display: inline-block; width: 48px; height: 4px; background-color: #00C896; border-radius: 999px; margin-bottom: 18px;"></div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.03em;">
                    ${COMPANY_NAME}
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #a9e5c7; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;">
                    Client portal
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 16px 0; color: #f5f7f6; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
                    Hi ${data.name},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #a2abad; font-size: 16px; line-height: 1.65;">
                    Use the secure link below to sign in to your ${COMPANY_NAME} client portal. This link expires in <strong style="color: #f5f7f6;">${data.expiresInMinutes} minutes</strong>.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                    <tr>
                      <td align="center">
                        <a href="${data.magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #00C896; color: #020617; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
                          Sign in to portal
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #8f9a9e; font-size: 13px; line-height: 1.6;">
                    If the button does not work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 0 0; padding: 12px; background-color: #070b12; border: 1px solid #ffffff12; border-radius: 8px; word-break: break-all;">
                    <a href="${data.magicLink}" style="color: #a9e5c7; text-decoration: none; font-size: 12px;">
                      ${data.magicLink}
                    </a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 28px 30px; background-color: #080c14; border-top: 1px solid #ffffff12;">
                  <p style="margin: 0 0 8px 0; color: #7e898d; font-size: 13px; text-align: center;">
                    Sent to <strong style="color: #a2abad;">${data.to}</strong>
                  </p>
                  <p style="margin: 0; color: #7e898d; font-size: 13px; text-align: center;">
                    If you did not request this email, you can ignore it.
                  </p>
                  <p style="margin: 18px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
                    ${emailCompanyFooter}
                  </p>
                  <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
Hi ${data.name},

Sign in to your ${COMPANY_NAME} client portal:

${data.magicLink}

This link expires in ${data.expiresInMinutes} minutes.

If you did not request this email, you can ignore it.

---
© ${new Date().getFullYear()} ${COMPANY_NAME}
${emailCompanyFooter}
  `.trim();

  try {
    if (isDevelopment) {
      console.log(`[Email] Attempting to send magic link via Resend to ${data.to}`);
    }

    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [data.to],
      subject: `Sign in to ${COMPANY_NAME} Client Portal`,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (isDevelopment) {
      console.log(`[Email] Magic link sent successfully to ${data.to}`, {
        emailId: emailData?.id,
      });
    } else {
      console.log('[Email] Magic link sent successfully', {
        emailId: emailData?.id,
      });
    }
  } catch (error) {
    // Log error without exposing recipient email address
    console.error('[Email] Failed to send magic link:', {
      error: error instanceof Error ? error.message : String(error),
      stack: isDevelopment && error instanceof Error ? error.stack : undefined,
    });

    // Throw a more descriptive error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email sending failed: ${errorMessage}`);
  }
}

// Send contact form email to admin via Resend
export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const resend = getResendClient();
  const adminEmail = process.env.EMAIL_ADMIN || 'info@hopstecinnovation.com';
  const fromEmail = 'noreply@hopstecinnovation.com';

  if (!resend) {
    console.error('[Email] Resend client not available for contact email');
    throw new Error('Email service not configured');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">New Contact Form Submission</h2>

          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
            <p style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${data.message}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            This email was sent from the ${COMPANY_NAME} contact form.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from the ${COMPANY_NAME} contact form.
  `.trim();

  try {
    console.log('[Email] Attempting to send contact form email via Resend:', {
      from: fromEmail,
      to: adminEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
    });

    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [adminEmail],
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[Email] Contact form email sent successfully:', {
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('[Email] Failed to send contact form email:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to send contact form email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Send project inquiry email to admin via Resend
export async function sendProjectInquiryEmail(data: ProjectInquiryEmailData): Promise<void> {
  const resend = getResendClient();
  const adminEmail = process.env.EMAIL_ADMIN || 'info@hopstecinnovation.com';
  const fromEmail = 'noreply@hopstecinnovation.com';

  if (!resend) {
    console.error('[Email] Resend client not available for project inquiry email');
    throw new Error('Email service not configured');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Project Inquiry</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #8b5cf6; margin-top: 0;">🚀 New Project Inquiry</h2>

          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #8b5cf6;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Project Details:</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${data.projectType}</p>
            ${data.budget ? `<p style="margin: 5px 0;"><strong>Budget:</strong> ${data.budget}</p>` : ''}
            ${data.timeline ? `<p style="margin: 5px 0;"><strong>Timeline:</strong> ${data.timeline}</p>` : ''}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Description:</h3>
            <p style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${data.description}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            This email was sent from the ${COMPANY_NAME} client portal.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Project Inquiry

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}

Project Details:
Type: ${data.projectType}
${data.budget ? `Budget: ${data.budget}` : ''}
${data.timeline ? `Timeline: ${data.timeline}` : ''}

Description:
${data.description}

---
This email was sent from the ${COMPANY_NAME} client portal.
  `.trim();

  try {
    console.log('[Email] Attempting to send project inquiry email via Resend:', {
      from: fromEmail,
      to: adminEmail,
      replyTo: data.email,
      subject: `Project Inquiry: ${data.projectType} - ${data.name}`,
    });

    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [adminEmail],
      replyTo: data.email,
      subject: `Project Inquiry: ${data.projectType} - ${data.name}`,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[Email] Project inquiry email sent successfully:', {
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('[Email] Failed to send project inquiry email:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to send project inquiry email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
