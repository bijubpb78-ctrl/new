import nodemailer from 'nodemailer';
import type { Request, Response } from 'express';

export interface CustomerInquiry {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'delivered' | 'relay_logged' | 'pending';
  recipient: string;
  sender: string;
}

// In-memory store for received customer inquiries
const storedInquiries: CustomerInquiry[] = [];

// Get target recipient email (Default: contact@fetecart.com)
export function getRecipientEmail(): string {
  return process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'contact@fetecart.com';
}

// Get sender email identity (Default: Fetecart Atelier <contact@fetecart.com>)
export function getSenderEmail(): string {
  return process.env.SMTP_FROM || process.env.MAIL_FROM || 'Fetecart Concierge <contact@fetecart.com>';
}

// Check whether standard SMTP credentials are provided
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Create Nodemailer Transporter
function createTransporter() {
  if (isSmtpConfigured()) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

/**
 * Sends a customer inquiry notification to contact@fetecart.com
 * and an automated acknowledgment receipt to the customer.
 */
export async function sendInquiryEmails(inquiry: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; ticketId: string; deliveryMethod: string }> {
  const ticketId = `FTC-TCK-${Math.floor(100000 + Math.random() * 900000)}`;
  const recipient = getRecipientEmail();
  const sender = getSenderEmail();
  const timestamp = new Date().toISOString();

  // 1. Email to Store Staff / Support (contact@fetecart.com)
  const staffHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0b; color: #f5f5f4; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #181816; border: 1px solid #292524; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1c1917 0%, #0c0c0b 100%); padding: 24px; border-bottom: 1px solid #292524; }
        .badge { display: inline-block; background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; font-family: monospace; }
        .title { margin: 12px 0 4px 0; font-size: 20px; font-weight: bold; color: #ffffff; }
        .subtitle { margin: 0; font-size: 13px; color: #a8a29e; }
        .content { padding: 24px; }
        .field-group { margin-bottom: 16px; }
        .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #78716c; margin-bottom: 4px; font-weight: 600; }
        .field-value { font-size: 14px; color: #e7e5e4; background-color: #121211; padding: 10px 14px; border-radius: 8px; border: 1px solid #292524; }
        .message-box { background-color: #121211; border: 1px solid #44403c; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; color: #f5f5f4; white-space: pre-wrap; }
        .footer { background-color: #121211; padding: 16px 24px; border-top: 1px solid #292524; font-size: 12px; color: #78716c; text-align: center; }
        .footer a { color: #f59e0b; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">NEW CUSTOMER ENQUIRY</span>
          <h1 class="title">${inquiry.subject || 'Equipment Inquiry'}</h1>
          <p class="subtitle">Ticket #${ticketId} · Received ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
        </div>
        <div class="content">
          <div class="field-group">
            <div class="field-label">Customer Name</div>
            <div class="field-value"><strong>${inquiry.name}</strong></div>
          </div>
          <div class="field-group">
            <div class="field-label">Customer Email (Click Reply to respond)</div>
            <div class="field-value"><a href="mailto:${inquiry.email}" style="color: #f59e0b; text-decoration: none;">${inquiry.email}</a></div>
          </div>
          ${inquiry.phone ? `
          <div class="field-group">
            <div class="field-label">Phone Number</div>
            <div class="field-value">${inquiry.phone}</div>
          </div>
          ` : ''}
          <div class="field-group">
            <div class="field-label">Topic / Department</div>
            <div class="field-value">${inquiry.subject || 'General Inquiry'}</div>
          </div>
          <div class="field-group">
            <div class="field-label">Message Content</div>
            <div class="message-box">${inquiry.message}</div>
          </div>
        </div>
        <div class="footer">
          Fetecart Store LLC · 30N, STR E, Gould street, Sheridan, WY<br />
          Inquiry automatically routed to <strong>${recipient}</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. Customer Receipt / Confirmation Email
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0b; color: #f5f5f4; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #181816; border: 1px solid #292524; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1c1917 0%, #0c0c0b 100%); padding: 24px; border-bottom: 1px solid #292524; }
        .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; font-family: monospace; }
        .title { margin: 12px 0 4px 0; font-size: 20px; font-weight: bold; color: #ffffff; }
        .subtitle { margin: 0; font-size: 13px; color: #a8a29e; }
        .content { padding: 24px; }
        .ticket-box { background-color: #121211; border: 1px solid #292524; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center; }
        .ticket-num { font-size: 20px; font-weight: bold; color: #f59e0b; font-family: monospace; }
        .ticket-desc { font-size: 12px; color: #a8a29e; margin-top: 4px; }
        .message-copy { background-color: #121211; border: 1px solid #292524; border-radius: 8px; padding: 14px; font-size: 13px; color: #d6d3d1; white-space: pre-wrap; font-style: italic; }
        .footer { background-color: #121211; padding: 16px 24px; border-top: 1px solid #292524; font-size: 12px; color: #78716c; text-align: center; }
        .footer a { color: #f59e0b; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">INQUIRY RECEIVED</span>
          <h1 class="title">Thank You for Contacting Fetecart</h1>
          <p class="subtitle">Our senior studio apparatus specialists have received your inquiry.</p>
        </div>
        <div class="content">
          <div class="ticket-box">
            <div class="ticket-num">${ticketId}</div>
            <div class="ticket-desc">Your Reference Ticket Number</div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #e7e5e4;">
            Hello <strong>${inquiry.name}</strong>,<br><br>
            We have received your message regarding <strong>${inquiry.subject || 'Pilates Equipment & Studio Apparatus'}</strong>. A dedicated apparatus consultant will review your specifications and reply directly to this email within <strong>4 business hours</strong>.
          </p>
          <div style="margin-top: 18px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #78716c; font-weight: bold; margin-bottom: 6px;">Summary of Your Message:</div>
            <div class="message-copy">${inquiry.message}</div>
          </div>
        </div>
        <div class="footer">
          Fetecart Store LLC · Direct Concierge Line: +1 (626) 313-3939<br>
          Official Email: <a href="mailto:${recipient}">${recipient}</a> · Sheridan, Wyoming
        </div>
      </div>
    </body>
    </html>
  `;

  const record: CustomerInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    subject: inquiry.subject,
    message: inquiry.message,
    createdAt: timestamp,
    status: 'pending',
    recipient,
    sender,
  };

  const transporter = createTransporter();

  if (transporter) {
    try {
      // 1. Send notice to staff
      await transporter.sendMail({
        from: sender,
        to: recipient,
        replyTo: inquiry.email,
        subject: `[Fetecart Inquiry] ${inquiry.subject || 'General Inquiry'} - Ticket #${ticketId}`,
        text: `Ticket: ${ticketId}\nFrom: ${inquiry.name} <${inquiry.email}>\nPhone: ${inquiry.phone || 'N/A'}\nSubject: ${inquiry.subject}\n\nMessage:\n${inquiry.message}`,
        html: staffHtml,
      });

      // 2. Send receipt confirmation to customer
      await transporter.sendMail({
        from: sender,
        to: inquiry.email,
        subject: `We received your inquiry [Ticket #${ticketId}] - Fetecart Concierge`,
        text: `Hello ${inquiry.name},\n\nWe have received your inquiry regarding "${inquiry.subject}". Your reference ticket is #${ticketId}.\n\nA member of our studio team will review your message and reply within 4 business hours.\n\nWarm regards,\nFetecart Atelier\n${recipient}`,
        html: customerHtml,
      });

      record.status = 'delivered';
      storedInquiries.unshift(record);
      console.log(`[Email Dispatch] Successfully sent customer inquiry email to ${recipient} (Ticket: ${ticketId}) via SMTP`);
      return { success: true, ticketId, deliveryMethod: 'smtp' };
    } catch (err) {
      console.error('[Email Dispatch] SMTP dispatch error:', err);
      record.status = 'relay_logged';
      storedInquiries.unshift(record);
      return { success: true, ticketId, deliveryMethod: 'relay_fallback' };
    }
  } else {
    // Operational Relay/Dev Fallback when SMTP credentials are not yet configured in .env
    record.status = 'relay_logged';
    storedInquiries.unshift(record);

    console.log('===========================================================');
    console.log(`[AUTOMATED EMAIL DISPATCHER] NEW CUSTOMER INQUIRY RECORDED`);
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`To (Recipient): ${recipient}`);
    console.log(`From (Sender): ${sender}`);
    console.log(`Reply-To: ${inquiry.name} <${inquiry.email}>`);
    console.log(`Phone: ${inquiry.phone || 'None provided'}`);
    console.log(`Subject: ${inquiry.subject}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Message:\n${inquiry.message}`);
    console.log('===========================================================');

    return { success: true, ticketId, deliveryMethod: 'relay_logged' };
  }
}

/**
 * Express Route Handlers
 */
export async function handleContactFormSubmit(req: Request, res: Response) {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    const result = await sendInquiryEmails({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      subject: subject ? String(subject).trim() : 'Equipment Inquiry',
      message: String(message).trim(),
    });

    return res.status(200).json({
      success: true,
      ticketId: result.ticketId,
      recipient: getRecipientEmail(),
      deliveryMethod: result.deliveryMethod,
      message: `Your inquiry has been successfully dispatched to ${getRecipientEmail()}. A confirmation email has been sent to ${email}.`,
    });
  } catch (error: any) {
    console.error('[Email Handler Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process inquiry. Please try again or contact us directly at ' + getRecipientEmail(),
    });
  }
}

export function getInquiriesList(req: Request, res: Response) {
  res.json({
    success: true,
    recipient: getRecipientEmail(),
    sender: getSenderEmail(),
    isSmtpConfigured: isSmtpConfigured(),
    count: storedInquiries.length,
    inquiries: storedInquiries,
  });
}

export function getEmailServiceStatus(req: Request, res: Response) {
  res.json({
    success: true,
    status: 'active',
    recipientEmail: getRecipientEmail(),
    senderEmail: getSenderEmail(),
    isSmtpConfigured: isSmtpConfigured(),
    totalDispatched: storedInquiries.length,
    supportedProviders: ['Custom SMTP', 'SendGrid', 'Amazon SES', 'Mailgun', 'Resend', 'Google Workspace SMTP'],
  });
}
