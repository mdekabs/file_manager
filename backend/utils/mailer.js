import nodemailer from 'nodemailer';

// Configure Nodemailer SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function to send welcome email
const sendWelcomeEmail = async (email) => {
  // Email content
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Welcome to our application!',
    text: `Hello,\n\nWelcome to our application!\n\nBest regards,\nThe Team`,
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    throw error; // Throw error to handle in calling function
  }
};

export { sendWelcomeEmail };
