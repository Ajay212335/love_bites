const nodemailer = require('nodemailer');

// Initialize Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;
  const service = process.env.SMTP_SERVICE || (user && user.endsWith('@gmail.com') ? 'gmail' : undefined);

  if (service === 'gmail' && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Send 6-digit OTP verification email to user
 */
async function sendOtpEmail(toEmail, otpCode, recipientName = 'Foodie Couple') {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Love Bites" <ddarn3681@gmail.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF5F7; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 75, 110, 0.08); border: 1px solid #FFE4E8; }
          .header { background: linear-gradient(135deg, #FF4B6E 0%, #FF758C 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; text-align: center; color: #2D3748; }
          .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #1A202C; }
          .instruction { font-size: 14px; line-height: 22px; color: #718096; margin-bottom: 24px; }
          .otp-card { background: #FFF0F3; border: 2px dashed #FF4B6E; border-radius: 14px; padding: 20px; margin: 0 auto 28px; max-width: 320px; }
          .otp-label { font-size: 12px; font-weight: 700; color: #FF4B6E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .otp-code { font-size: 36px; font-weight: 900; color: #1A202C; letter-spacing: 8px; margin: 0; }
          .expiry { font-size: 12px; color: #A0AEC0; margin-top: 6px; }
          .footer { background: #F7FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EDF2F7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Love Bites 💖</h1>
            <p>Romantic Sparks & Culinary Adventures for Two</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${recipientName}!</div>
            <p class="instruction">
              Thank you for signing up for Love Bites. Please use the 6-digit verification code below to activate your account:
            </p>
            <div class="otp-card">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otpCode}</div>
              <div class="expiry">Expires in 10 minutes</div>
            </div>
            <p class="instruction" style="font-size: 12px; color: #A0AEC0; margin-bottom: 0;">
              If you did not request this verification, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Love Bites App. Built for couples with ❤️.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `Your Love Bites Verification Code: ${otpCode} 💖`,
        text: `Your Love Bites verification code is: ${otpCode}. It will expire in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`✉️ [Email Service] Real OTP email successfully delivered to: ${toEmail} (MessageId: ${info.messageId})`);
      return { success: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Nodemailer failed to send email to ${toEmail}:`, err.message);
      return { success: false, delivered: false, error: err.message };
    }
  } else {
    console.log(`\n==============================================`);
    console.log(`✉️  [Love Bites Email Service - SMTP not configured]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Your Love Bites Verification Code: ${otpCode}`);
    console.log(`🔑 OTP Code: [ ${otpCode} ] (Valid for 10 min)`);
    console.log(`ℹ️  To send via real Gmail/SMTP, add EMAIL_USER & EMAIL_PASS to server/.env`);
    console.log(`==============================================\n`);
    return { success: true, delivered: false, note: 'Logged to server console (configure SMTP in server/.env)' };
  }
}

/**
 * Send Welcome / Registration Confirmation Email
 */
async function sendWelcomeEmail(toEmail, recipientName = 'Foodie Couple') {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Love Bites" <ddarn3681@gmail.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF5F7; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 75, 110, 0.08); border: 1px solid #FFE4E8; }
          .header { background: linear-gradient(135deg, #FF4B6E 0%, #FF758C 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; text-align: center; color: #2D3748; }
          .greeting { font-size: 20px; font-weight: 800; margin-bottom: 12px; color: #1A202C; }
          .instruction { font-size: 14px; line-height: 22px; color: #718096; margin-bottom: 20px; }
          .feature-box { background: #FFF5F7; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
          .feature-item { font-size: 13px; color: #4A5568; margin-bottom: 8px; line-height: 18px; }
          .footer { background: #F7FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EDF2F7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Love Bites! 💖</h1>
            <p>Your Account is Officially Verified & Active</p>
          </div>
          <div class="content">
            <div class="greeting">Welcome aboard, ${recipientName}! 🎉</div>
            <p class="instruction">
              Your email (<strong>${toEmail}</strong>) has been successfully verified, and your Love Bites dynamic couple account is now fully active.
            </p>
            <div class="feature-box">
              <div class="feature-item">✨ <strong>Pair with Your Partner:</strong> Link your partner in the Profile tab to share daily sparks and reminders.</div>
              <div class="feature-item">⏰ <strong>Daily Couple Tasks:</strong> Create shared morning rituals, night sparks, and cooking adventures.</div>
              <div class="feature-item">🔔 <strong>Instant Nudges:</strong> Send instant notifications to your partner to keep your connection alive.</div>
            </div>
            <p class="instruction">
              Open the app now and start creating moments together!
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Love Bites App. Built for couples with ❤️.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `Welcome to Love Bites, ${recipientName}! 💖 Account Activated`,
        text: `Welcome to Love Bites, ${recipientName}! Your email ${toEmail} is verified and your account is now ready to use.`,
        html: htmlContent,
      });
      console.log(`✉️ [Email Service] Registration welcome email delivered to: ${toEmail}`);
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send welcome email to ${toEmail}:`, err.message);
    }
  }
}

/**
 * Send Partner Added / Linked Invitation Email
 */
async function sendPartnerAddedEmail(partnerEmail, partnerName, currentUserName, currentUserEmail) {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Love Bites" <ddarn3681@gmail.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF5F7; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 75, 110, 0.08); border: 1px solid #FFE4E8; }
          .header { background: linear-gradient(135deg, #FF4B6E 0%, #FF758C 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; text-align: center; color: #2D3748; }
          .greeting { font-size: 20px; font-weight: 800; margin-bottom: 12px; color: #1A202C; }
          .instruction { font-size: 14px; line-height: 22px; color: #718096; margin-bottom: 20px; }
          .partner-box { background: #FFF0F3; border: 2px dashed #FF4B6E; border-radius: 14px; padding: 20px; margin: 20px auto; max-width: 360px; }
          .partner-badge { font-size: 12px; font-weight: 700; color: #FF4B6E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .partner-name { font-size: 22px; font-weight: 900; color: #1A202C; margin: 4px 0; }
          .partner-email { font-size: 13px; color: #718096; }
          .feature-box { background: #FFF5F7; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
          .feature-item { font-size: 13px; color: #4A5568; margin-bottom: 8px; line-height: 18px; }
          .footer { background: #F7FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EDF2F7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Love Bites 💖</h1>
            <p>Romantic Sparks & Couple Connection</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${partnerName}! 💖</div>
            <p class="instruction">
              <strong>${currentUserName}</strong> (${currentUserEmail}) has added you as their partner on <strong>Love Bites</strong>!
            </p>
            <div class="partner-box">
              <div class="partner-badge">Connected Partner</div>
              <div class="partner-name">${currentUserName}</div>
              <div class="partner-email">${currentUserEmail}</div>
            </div>
            <div class="feature-box">
              <div class="feature-item">🔔 <strong>Instant Couple Nudges:</strong> Receive alarms & loving reminders when ${currentUserName} nudges you.</div>
              <div class="feature-item">📅 <strong>Shared Daily Tasks:</strong> Create, complete, and track couple goals and romantic rituals together.</div>
              <div class="feature-item">✨ <strong>Streaks & Habits:</strong> Keep your bond strong with daily shared moments.</div>
            </div>
            <p class="instruction">
              Open Love Bites and log in with your email (<strong>${partnerEmail}</strong>) to start sharing tasks with ${currentUserName}!
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Love Bites App. Built for couples with ❤️.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: partnerEmail,
        subject: `💖 ${currentUserName} added you as their partner on Love Bites!`,
        text: `Hello ${partnerName}, ${currentUserName} (${currentUserEmail}) has added you as their partner on Love Bites! Log in with ${partnerEmail} to start sharing tasks and moments together.`,
        html: htmlContent,
      });
      console.log(`✉️ [Email Service] Partner added notification email delivered to: ${partnerEmail} (MessageId: ${info.messageId})`);
      return { success: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send partner added email to ${partnerEmail}:`, err.message);
      return { success: false, delivered: false, error: err.message };
    }
  }
}

/**
 * Send Confirmation Email to the user who linked the partner
 */
async function sendPartnerLinkedConfirmationToUser(userEmail, userName, partnerName, partnerEmail) {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Love Bites" <ddarn3681@gmail.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF5F7; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 75, 110, 0.08); border: 1px solid #FFE4E8; }
          .header { background: linear-gradient(135deg, #FF4B6E 0%, #FF758C 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; text-align: center; color: #2D3748; }
          .greeting { font-size: 20px; font-weight: 800; margin-bottom: 12px; color: #1A202C; }
          .instruction { font-size: 14px; line-height: 22px; color: #718096; margin-bottom: 20px; }
          .partner-box { background: #FFF0F3; border: 2px dashed #FF4B6E; border-radius: 14px; padding: 20px; margin: 20px auto; max-width: 360px; }
          .partner-badge { font-size: 12px; font-weight: 700; color: #FF4B6E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .partner-name { font-size: 22px; font-weight: 900; color: #1A202C; margin: 4px 0; }
          .partner-email { font-size: 13px; color: #718096; }
          .feature-box { background: #FFF5F7; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
          .feature-item { font-size: 13px; color: #4A5568; margin-bottom: 8px; line-height: 18px; }
          .footer { background: #F7FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EDF2F7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Love Bites 💖</h1>
            <p>Partner Connected Successfully!</p>
          </div>
          <div class="content">
            <div class="greeting">Congratulations, ${userName}! 🎉</div>
            <p class="instruction">
              You are now officially connected with <strong>${partnerName}</strong> (${partnerEmail}) on <strong>Love Bites</strong>!
            </p>
            <div class="partner-box">
              <div class="partner-badge">Your Connected Partner</div>
              <div class="partner-name">${partnerName}</div>
              <div class="partner-email">${partnerEmail}</div>
            </div>
            <div class="feature-box">
              <div class="feature-item">⏰ <strong>Timed Reminders:</strong> Assign shared daily routines and get notified together.</div>
              <div class="feature-item">💖 <strong>Instant Nudges:</strong> Tap "Tell ${partnerName}" to ping them instantly anytime.</div>
              <div class="feature-item">✨ <strong>Couples Streaks:</strong> Build daily habits side by side.</div>
            </div>
            <p class="instruction">
              Both of your accounts are now linked. An invitation email was also sent to <strong>${partnerEmail}</strong>.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Love Bites App. Built for couples with ❤️.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: userEmail,
        subject: `💖 You are now linked with ${partnerName} on Love Bites!`,
        text: `Hello ${userName}, you have successfully connected with ${partnerName} (${partnerEmail}) on Love Bites!`,
        html: htmlContent,
      });
      console.log(`✉️ [Email Service] Partner confirmation email delivered to sender: ${userEmail} (MessageId: ${info.messageId})`);
      return { success: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send partner confirmation email to ${userEmail}:`, err.message);
      return { success: false, delivered: false, error: err.message };
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPartnerAddedEmail,
  sendPartnerLinkedConfirmationToUser,
};
