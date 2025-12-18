const nodemailer = require("nodemailer");

// Create transporter - lazy initialization
let transporter = null;
let initPromise = null;

async function getTransporter() {
  // If already initialized, return it
  if (transporter) {
    return transporter;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    await initPromise;
    return transporter;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Use custom SMTP if configured (Gmail, SendGrid, etc.)
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        console.log(`📧 Using SMTP: ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
      } else {
        // Development: Use Ethereal Email (fake SMTP)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log("📧 Using Ethereal Email for development (no SMTP configured)");
      }
    } catch (error) {
      console.error("Failed to create email transporter:", error);
      throw error;
    }
  })();

  await initPromise;
  return transporter;
}

/**
 * Send verification email to user
 */
async function sendVerificationEmail(user, token) {
  const transporter = await getTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Task Management System!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            An account has been created for you. Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't request this, please ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${verificationUrl}" style="color: #0d6efd;">${verificationUrl}</a>
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Log preview URL for Ethereal
  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Verification Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Send approval email to user
 */
async function sendApprovalEmail(user) {
  const transporter = await getTransporter();
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: "Your Account Has Been Approved! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 20px;">✅ Account Approved!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your account has been approved by our admin team. You can now log in to the Task Management System.
          </p>
          <div style="background: #e7f7ef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-weight: bold;">Email: ${user.email}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Log preview URL for Ethereal
  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Approval Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Send rejection email to user
 */
async function sendRejectionEmail(user, reason = '') {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: "Account Registration Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Account Registration Status</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for your interest in the Task Management System. Unfortunately, your account registration could not be approved at this time.
          </p>
          ${reason ? `<p style="color: #666; font-size: 16px; line-height: 1.6;">Reason: ${reason}</p>` : ''}
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you believe this is an error or have questions, please contact our support team.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Task Management System Team
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Log preview URL for Ethereal
  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Rejection Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Notify admin about new user registration
 */
async function notifyAdminNewRegistration(user, adminEmail) {
  const transporter = await getTransporter();
  const adminPanelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: adminEmail,
    subject: "🔔 New User Registration - Pending Approval",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #0d6efd; margin-bottom: 20px;">🔔 New User Registration</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hello Admin,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            A new user has registered and is awaiting your approval.
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0d6efd;">
            <p style="margin: 0 0 10px 0; color: #333;"><strong>Name:</strong> ${user.name}</p>
            <p style="margin: 0 0 10px 0; color: #333;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 0 0 10px 0; color: #333;"><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p style="margin: 0; color: #333;"><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminPanelUrl}" 
               style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review in Admin Panel
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Please review and approve or reject this user registration from the Admin Panel.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Log preview URL for Ethereal
  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Admin Notification Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Send task assignment notification email
 */
async function sendTaskAssignmentEmail(user, task, project) {
  const transporter = await getTransporter();
  const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: `📋 New Task Assigned: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #0d6efd; margin-bottom: 20px;">📋 New Task Assigned</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have been assigned a new task.
          </p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745'};">
            <h3 style="margin-top: 0; color: #333;">${task.title}</h3>
            <p style="color: #666; margin-bottom: 15px;">${task.description || 'No description provided'}</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Project:</strong> ${project?.name || 'N/A'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745'};">${task.priority}</span></p>
            <p style="margin: 5px 0; color: #333;"><strong>Status:</strong> ${task.status}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Due Date:</strong> ${task.taskDate ? new Date(task.taskDate).toLocaleDateString() : 'Not set'}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Task
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Task Management System Team
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Task Assignment Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, resetToken) {
  const transporter = await getTransporter();
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: "🔐 Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">🔐 Password Reset Request</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Important:</strong></p>
            <ul style="margin: 10px 0 0 20px; color: #856404; font-size: 14px;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password will remain unchanged</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #0d6efd; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Task Management System Team
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Password Reset Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

/**
 * Send task deadline reminder email
 */
async function sendTaskReminderEmail(user, task, project) {
  const transporter = await getTransporter();
  const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks`;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Task Management System'}" <${process.env.FROM_EMAIL || 'noreply@tms.com'}>`,
    to: user.email,
    subject: `⏰ Task Deadline Reminder: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #ffc107; margin-bottom: 20px;">⏰ Task Deadline Reminder</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder about an upcoming task deadline.
          </p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #333;">${task.title}</h3>
            <p style="color: #666; margin-bottom: 15px;">${task.description || 'No description provided'}</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Project:</strong> ${project?.name || 'N/A'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Priority:</strong> <span style="text-transform: uppercase;">${task.priority}</span></p>
            <p style="margin: 5px 0; color: #333;"><strong>Status:</strong> ${task.status}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Due Date:</strong> ${task.taskDate ? new Date(task.taskDate).toLocaleDateString() : 'Not set'}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Task
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            Task Management System Team
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    console.log("📧 Task Reminder Email Preview:", nodemailer.getTestMessageUrl(info));
  }

  return info;
}

module.exports = {
  sendVerificationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  notifyAdminNewRegistration,
  sendTaskAssignmentEmail,
  sendPasswordResetEmail,
  sendTaskReminderEmail,
};
