import { Resend } from 'resend';
import { applicationConfirmationTemplate, interviewInvitationTemplate, helpRequestTemplate } from './email.templates.js';

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

export const sendInterviewInvitation = async ({ to, firstName, jobTitle, companyName, interviewLink, scheduledAt, pin }) => {
    if (!resend) {
        console.warn('RESEND_API_KEY not set — skipping interview invitation to', to);
        return;
    }

    await resend.emails.send({
        from: `HireAI <${FROM_ADDRESS}>`,
        to: [to],
        subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
        html: interviewInvitationTemplate({ firstName, jobTitle, companyName, interviewLink, scheduledAt, pin }),
    });
};


// Notify company HR that a candidate needs help during their interview
export const sendHelpRequest = async ({ to, candidateName, companyName, message }) => {
    if (!resend) {
        console.warn('RESEND_API_KEY not set — skipping help request email to', to);
        return;
    }

    const sentAt = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    await resend.emails.send({
        from: `HireAI <${FROM_ADDRESS}>`,
        to: [to],
        subject: `Interview Help Request from ${candidateName}`,
        html: helpRequestTemplate({ candidateName, companyName, message, sentAt }),
    });
};
