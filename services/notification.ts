
/**
 * UI DLC Marketplace - Notification Service (Placeholder)
 * This service simulates sending transactional emails.
 */

export const sendEmailPlaceholder = (to: string, subject: string, body: string) => {
  const timestamp = new Date().toLocaleString();
  
  // Create a stylized console output to simulate an email receipt
  console.log(
    `%c📧 EMAIL NOTIFICATION SENT [${timestamp}]\n` +
    `%cTo: %c${to}\n` +
    `%cSubject: %c${subject}\n` +
    `%c--------------------------------------------------\n` +
    `%c${body}\n` +
    `%c--------------------------------------------------\n` +
    `%cThis is an automated message from the UI DLC Marketplace system.`,
    "color: #1e40af; font-weight: 900; font-size: 14px;",
    "color: #64748b; font-weight: bold;", "color: #0f172a; font-weight: normal;",
    "color: #64748b; font-weight: bold;", "color: #1e40af; font-weight: bold;",
    "color: #94a3b8;",
    "color: #334155; line-height: 1.5; font-family: sans-serif;",
    "color: #94a3b8;",
    "color: #94a3b8; font-style: italic; font-size: 10px;"
  );
  
  // In a real implementation, you would use a service like SendGrid, Mailgun, 
  // or a backend endpoint (e.g., Appwrite's functions or a custom Node/Python API).
};
