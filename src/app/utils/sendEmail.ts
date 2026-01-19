import nodemailer from 'nodemailer';

export const sendEmail = async (link: string, email: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'saikotroydev@gmail.com',
      pass: process.env.EMAIL_PASSWORD, // Use environment variable for security
    },
  });

  const htmlContent = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background-color: #4CAF50;
        color: #ffffff;
        padding: 20px;
        text-align: center;
        font-size: 24px;
      }
      .content {
        padding: 30px;
        color: #333333;
        line-height: 1.6;
      }
      .content p {
        margin: 0 0 20px;
      }
      .content a {
        display: inline-block;
        padding: 12px 20px;
        color: #ffffff;
        background-color: #4CAF50;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        padding: 15px;
        background-color: #f1f1f1;
        font-size: 12px;
        color: #777777;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">Reset Your Password</div>
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it. This link is valid for 1 hour.</p>
        <a href="${link}" target="_blank">Reset Password</a>
        <p>If you did not request this password reset, you can ignore this email. Your password will remain unchanged.</p>
        <p>Thank you,<br>The Munna IPTV Team</p>
      </div>
      <div class="footer">&copy; 2025 Munna IPTV Team. All rights reserved.</div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: '"Iptv Support" <rasheduzzamanreshad@gmail.com>',
    to: email,
    subject: 'Reset your password within 1 hour',
    text: `Reset your password here: ${link}`,
    html: htmlContent,
  });
};
