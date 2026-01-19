// Helper function to format duration
const formatDuration = (durationMs?: number): string => {
  if (!durationMs) return "permanent";

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    const minutes = Math.floor(durationMs / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
};

const FONT_LINK = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
`;

const BASE_STYLES = `
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
`;

// Email template for mute notification
export const createMuteEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
  duration?: number,
): { html: string; text: string } => {
  const durationText = formatDuration(duration);
  const reasonText = reason || "No explicit reason provided.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${FONT_LINK}
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; ${BASE_STYLES}">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 40px;">
            <p style="color: #52525b; font-size: 10px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">Command Center /// Alert</p>
            <h1 style="color: #f4f4f5; font-size: 24px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 1px;">Games of Generals</h1>
          </div>

          <!-- Status Indicator -->
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: rgba(245, 158, 11, 0.1); border-left: 2px solid #f59e0b; color: #f59e0b; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
              Communication Subsystems Offline
            </div>
          </div>

          <!-- Main Message -->
          <h2 style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px; font-weight: normal;">Attention <span style="color: #fff; font-weight: bold;">${username}</span></h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
            Your communication privileges have been temporarily suspended by command directive. Tactical chat channels are currently unavailable for your account.
          </p>

          <!-- Details Grid -->
          <div style="text-align: left; background-color: #18181b; padding: 20px; margin-bottom: 40px;">
            <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Suspension Data</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Type</td>
                <td style="padding: 8px 0; color: #f59e0b; font-size: 12px; font-weight: bold; text-align: right;">Chat Mute</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Duration</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${durationText}</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Officer</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${moderatorUsername}</td>
              </tr>
            </table>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #27272a;">
              <p style="color: #71717a; font-size: 12px; text-transform: uppercase; margin: 0 0 5px;">Violation Code</p>
              <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${reasonText}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px;">
             <p style="color: #3f3f46; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
               System Generated Notification /// Do Not Reply
             </p>
          </div>

        </div>
      </body>
    </html>
  `;

  const text = `
GAMES OF GENERALS /// COMMAND CENTER ALERT
------------------------------------------
COMMUNICATION SUBSYSTEMS OFFLINE

Attention ${username},

Your communication privileges have been temporarily suspended by command directive.

SUSPENSION DATA
---------------
TYPE:     Chat Mute
DURATION: ${durationText}
OFFICER:  ${moderatorUsername}
REASON:   ${reasonText}

System Generated Notification
`.trim();

  return { html, text };
};

// Email template for ban notification
export const createBanEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
  duration?: number,
): { html: string; text: string } => {
  const durationText = formatDuration(duration);
  const reasonText = reason || "No explicit reason provided.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${FONT_LINK}
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; ${BASE_STYLES}">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 40px;">
            <p style="color: #7f1d1d; font-size: 10px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">Security Breach /// Alert</p>
            <h1 style="color: #f4f4f5; font-size: 24px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 1px;">Games of Generals</h1>
          </div>

          <!-- Status Indicator -->
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: rgba(220, 38, 38, 0.1); border-left: 2px solid #dc2626; color: #dc2626; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
              Account Access Suspended
            </div>
          </div>

          <!-- Main Message -->
          <h2 style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px; font-weight: normal;">Attention <span style="color: #fff; font-weight: bold;">${username}</span></h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
            Your command clearance has been revoked. Tactical operations are suspended immediately due to protocol violations. ${duration ? "Access will be restored after the cooldown period." : "This is a permanent termination of access."}
          </p>

          <!-- Details Grid -->
          <div style="text-align: left; background-color: #18181b; padding: 20px; margin-bottom: 40px;">
            <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Suspension Data</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Type</td>
                <td style="padding: 8px 0; color: #ef4444; font-size: 12px; font-weight: bold; text-align: right;">Game Ban</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Duration</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${durationText}</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Officer</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${moderatorUsername}</td>
              </tr>
            </table>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #27272a;">
              <p style="color: #71717a; font-size: 12px; text-transform: uppercase; margin: 0 0 5px;">Violation Code</p>
              <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${reasonText}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px;">
             <p style="color: #3f3f46; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
               System Generated Notification /// Do Not Reply
             </p>
          </div>

        </div>
      </body>
    </html>
  `;

  const text = `
GAMES OF GENERALS /// SECURITY BREACH ALERT
-------------------------------------------
ACCOUNT ACCESS SUSPENDED

Attention ${username},

Your command clearance has been revoked. Tactical operations are suspended immediately.

SUSPENSION DATA
---------------
TYPE:     Game Ban
DURATION: ${durationText}
OFFICER:  ${moderatorUsername}
REASON:   ${reasonText}

System Generated Notification
`.trim();

  return { html, text };
};

// Email template for unmute notification
export const createUnmuteEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
): { html: string; text: string } => {
  const reasonText = reason || "Time served / Appeal granted.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${FONT_LINK}
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; ${BASE_STYLES}">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 40px;">
            <p style="color: #059669; font-size: 10px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">Command Center /// Update</p>
            <h1 style="color: #f4f4f5; font-size: 24px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 1px;">Games of Generals</h1>
          </div>

          <!-- Status Indicator -->
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.1); border-left: 2px solid #10b981; color: #10b981; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
              Comms Channels Restored
            </div>
          </div>

          <!-- Main Message -->
          <h2 style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px; font-weight: normal;">Greetings <span style="color: #fff; font-weight: bold;">${username}</span></h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
            Your communication privileges have been reinstated. You may resume tactical communications immediately.
          </p>

          <!-- Details Grid -->
          <div style="text-align: left; background-color: #18181b; padding: 20px; margin-bottom: 40px;">
            <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Restoration Data</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Type</td>
                <td style="padding: 8px 0; color: #10b981; font-size: 12px; font-weight: bold; text-align: right;">Unmute</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Officer</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${moderatorUsername}</td>
              </tr>
            </table>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #27272a;">
              <p style="color: #71717a; font-size: 12px; text-transform: uppercase; margin: 0 0 5px;">Note</p>
              <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${reasonText}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px;">
             <p style="color: #3f3f46; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
               System Generated Notification /// Do Not Reply
             </p>
          </div>

        </div>
      </body>
    </html>
  `;

  const text = `
GAMES OF GENERALS /// COMMAND CENTER UPDATE
-------------------------------------------
COMMS CHANNELS RESTORED

Greetings ${username},

Your communication privileges have been reinstated. You may resume tactical communications immediately.

RESTORATION DATA
----------------
TYPE:     Unmute
OFFICER:  ${moderatorUsername}
NOTE:     ${reasonText}

System Generated Notification
`.trim();

  return { html, text };
};

// Email template for unban notification
export const createUnbanEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
): { html: string; text: string } => {
  const reasonText = reason || "Time served / Appeal granted.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${FONT_LINK}
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; ${BASE_STYLES}">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 40px;">
            <p style="color: #059669; font-size: 10px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">Command Center /// Update</p>
            <h1 style="color: #f4f4f5; font-size: 24px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 1px;">Games of Generals</h1>
          </div>

          <!-- Status Indicator -->
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: rgba(16, 185, 129, 0.1); border-left: 2px solid #10b981; color: #10b981; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
              Clearance Restored
            </div>
          </div>

          <!-- Main Message -->
          <h2 style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px; font-weight: normal;">Welcome Back <span style="color: #fff; font-weight: bold;">${username}</span></h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
            Your command clearance has been reinstated. You are authorized to resume global operations.
          </p>

          <!-- Details Grid -->
          <div style="text-align: left; background-color: #18181b; padding: 20px; margin-bottom: 40px;">
            <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Restoration Data</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Type</td>
                <td style="padding: 8px 0; color: #10b981; font-size: 12px; font-weight: bold; text-align: right;">Game Unban</td>
              </tr>
              <tr>
                 <td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase;">Officer</td>
                 <td style="padding: 8px 0; color: #e4e4e7; font-size: 12px; font-weight: bold; text-align: right;">${moderatorUsername}</td>
              </tr>
            </table>
            
           <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #27272a;">
              <p style="color: #71717a; font-size: 12px; text-transform: uppercase; margin: 0 0 5px;">Note</p>
              <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${reasonText}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px;">
             <p style="color: #3f3f46; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
               System Generated Notification /// Do Not Reply
             </p>
          </div>

        </div>
      </body>
    </html>
  `;

  const text = `
GAMES OF GENERALS /// COMMAND CENTER UPDATE
-------------------------------------------
CLEARANCE RESTORED

Welcome Back ${username},

Your command clearance has been reinstated. You are authorized to resume global operations.

RESTORATION DATA
----------------
TYPE:     Game Unban
OFFICER:  ${moderatorUsername}
NOTE:     ${reasonText}

System Generated Notification
`.trim();

  return { html, text };
};

// Email template for password reset
export const createPasswordResetEmailTemplate = (
  token: string,
): { html: string; text: string } => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        ${FONT_LINK}
      </head>
      <body style="margin: 0; padding: 0; background-color: #09090b; ${BASE_STYLES}">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          
          <!-- Header -->
          <div style="margin-bottom: 40px;">
            <p style="color: #3b82f6; font-size: 10px; letter-spacing: 3px; margin: 0; text-transform: uppercase;">Identity Verification /// Request</p>
            <h1 style="color: #f4f4f5; font-size: 24px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 1px;">Games of Generals</h1>
          </div>

          <!-- Status Indicator -->
          <div style="margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 16px; background-color: rgba(59, 130, 246, 0.1); border-left: 2px solid #3b82f6; color: #3b82f6; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
              Password Reset Protocol
            </div>
          </div>

          <!-- Main Message -->
          <h2 style="color: #e4e4e7; font-size: 18px; margin-bottom: 20px; font-weight: normal;">Access Credentials Recovery</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
            A request to reset your command codes has been intercepted. Authenticate with the verification token below to proceed.
          </p>

          <!-- Verification Code Box -->
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 30px; margin-bottom: 40px; text-align: center;">
            <p style="color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 15px 0;">Token</p>
            <div style="font-size: 48px; font-weight: bold; color: #fff; letter-spacing: 8px; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">
              ${token}
            </div>
            <p style="color: #71717a; font-size: 12px; margin: 15px 0 0 0;">Expires in 10 minutes</p>
          </div>

          <!-- Security Notice -->
          <div style="text-align: left; padding: 15px; border-left: 2px solid #52525b; background-color: #18181b; margin-bottom: 40px;">
            <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0;">
              <strong style="color: #e4e4e7; text-transform: uppercase;">Security Directive:</strong> If this request was not initiated from your terminal, disregard this communication. Your clearance remains secure.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px;">
             <p style="color: #3f3f46; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
               System Generated Notification /// Do Not Reply
             </p>
          </div>

        </div>
      </body>
    </html>
  `;

  const text = `
GAMES OF GENERALS /// IDENTITY VERIFICATION
-------------------------------------------
PASSWORD RESET PROTOCOL

Access Credentials Recovery

A request to reset your command codes has been intercepted. Authenticate with the verification token below.

TOKEN: ${token}
(Expires in 10 minutes)

If this request was not initiated from your terminal, disregard this communication.

System Generated Notification
`.trim();

  return { html, text };
};
