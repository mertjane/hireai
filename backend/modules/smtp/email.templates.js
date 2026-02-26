export const applicationConfirmationTemplate = ({ firstName, jobTitle, companyName, appliedAt }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received – HireAI</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f6;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">HireAI</h1>
              <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;letter-spacing:0.3px;">Modern Recruitment Platform</p>
            </td>
          </tr>

          <!-- ── MAIN ── -->
          <tr>
            <td style="background:#ffffff;padding:48px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <!-- Icon -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:64px;height:64px;background:#f3f0ff;border-radius:50%;text-align:center;line-height:64px;">
                  <span style="font-size:28px;color:#7c3aed;">&#10003;</span>
                </div>
              </div>

              <!-- Title -->
              <h2 style="color:#111827;font-size:22px;font-weight:700;text-align:center;margin:0 0 10px;">
                Application Received!
              </h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.65;text-align:center;margin:0 0 36px;">
                Hi <strong style="color:#111827;">${firstName}</strong>, we've successfully received your application and our team will review it shortly.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:36px;">
                <tr>
                  <td style="padding:20px 24px 4px;">
                    <p style="color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0;">Application Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="color:#6b7280;font-size:13px;">Position</span>
                        </td>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">
                          <span style="color:#111827;font-size:13px;font-weight:600;">${jobTitle}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="color:#6b7280;font-size:13px;">Company</span>
                        </td>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">
                          <span style="color:#111827;font-size:13px;font-weight:600;">${companyName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <span style="color:#6b7280;font-size:13px;">Date Applied</span>
                        </td>
                        <td style="padding:10px 0;text-align:right;">
                          <span style="color:#111827;font-size:13px;font-weight:600;">${appliedAt}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Body text -->
              <p style="color:#6b7280;font-size:14px;line-height:1.75;margin:0 0 16px;">
                We carefully review every application. If your profile matches what we're looking for, a member of our team will reach out to discuss the next steps.
              </p>
              <p style="color:#6b7280;font-size:14px;line-height:1.75;margin:0;">
                In the meantime, feel free to browse other opportunities on <a href="https://hireai.com/jobs" style="color:#7c3aed;text-decoration:none;font-weight:500;">HireAI</a>.
              </p>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 48px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 6px;">
                This is an automated message — please do not reply to this email.
              </p>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} HireAI &nbsp;&middot;&nbsp;
                <span style="color:#d1d5db;">noreply@hireai.com</span>
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
