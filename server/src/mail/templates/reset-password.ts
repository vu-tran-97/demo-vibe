export function resetPasswordTemplate(params: {
  name: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#6366f1;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Vibe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;color:#18181b;font-size:22px;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${params.name}, we received a request to reset your password. Click the button below to set a new one.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:#6366f1;border-radius:6px;padding:14px 32px;">
                    <a href="${params.resetUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#71717a;font-size:14px;">
                This link will expire in 1 hour.
              </p>
              <p style="margin:0 0 16px;color:#71717a;font-size:14px;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#a1a1aa;font-size:12px;word-break:break-all;">
                If the button doesn't work, copy and paste this URL:<br/>
                ${params.resetUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                &copy; Vibe. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
