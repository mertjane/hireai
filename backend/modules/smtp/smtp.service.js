import { Resend } from 'resend';
import { applicationConfirmationTemplate } from './email.templates.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export const sendApplicationConfirmation = async ({ to, firstName, jobTitle, companyName }) => {
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
