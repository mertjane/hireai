import { Resend } from 'resend';
import { applicationConfirmationTemplate } from './email.templates.js';

// Skip Resend init if API key is missing — prevents crash in environments without email config
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export const sendApplicationConfirmation = async ({ to, firstName, jobTitle, companyName }) => {
    if (!resend) {
        console.warn('RESEND_API_KEY not set — skipping email to', to);
        return;
    }

    const appliedAt = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    await resend.emails.send({
        from: `HireAI <${FROM_ADDRESS}>`,
        to: [to],
        subject: `Your application for ${jobTitle} has been received`,
        html: applicationConfirmationTemplate({ firstName, jobTitle, companyName, appliedAt }),
    });
};
