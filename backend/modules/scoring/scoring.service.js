import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import supabase from '../../config/db.js';
import * as iQuestionRepo from '../interview-questions/iQuestion.repository.js';

// use Groq if key exists, otherwise fall back to Claude
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const extractTextFromPDF = async (buffer) => {
    const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str || '').join(' ') + '\n';
    }
    await doc.destroy();
    return text.trim();
};

const extractTextFromBuffer = async (buffer, mimetype) => {
    if (mimetype === 'application/pdf') {
        return await extractTextFromPDF(buffer);
    }
    // DOCX/DOC: crude fallback — readable enough for scoring
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').slice(0, 6000);
};

const fetchJobDetails = async (job_id) => {
    const { data } = await supabase
        .from('jobs')
        .select('title, description')
        .eq('id', job_id)
        .maybeSingle();
    return data;
};

export const scoreCV = async ({ candidateId, fileBuffer, mimetype, job_id, job_title }) => {
    console.log(`[scoring] Starting CV score for candidate ${candidateId}`);

    const cvText = await extractTextFromBuffer(fileBuffer, mimetype);
    if (!cvText || cvText.trim().length < 50) {
        console.warn('[scoring] CV text too short or empty, skipping');
        return null;
    }
    console.log(`[scoring] CV text extracted (${cvText.length} chars)`);

    const job = await fetchJobDetails(job_id);
    const resolvedTitle = job?.title ?? job_title ?? 'the position';
    const resolvedDescription = job?.description ?? 'Not provided';
    console.log(`[scoring] Job resolved: "${resolvedTitle}"`);

    const systemPrompt = `You are a strict ATS (Applicant Tracking System) evaluator used by competitive tech companies.

Analyse the CV against the job posting by following these steps:
1. Extract the top 6 required skills/technologies from the job description
2. Check each one against the CV — mark as matched or missing
3. Calculate a score (0-100) based on the results

Return ONLY valid JSON in this exact format:
{
  "required_skills": ["skill1", "skill2", ...],
  "matched": ["skill1", ...],
  "missing": ["skill2", ...],
  "score": <integer 0-100>
}

Scoring guide:
- 6/6 skills matched + strong experience: 80-90
- 4-5/6 matched: 65-79
- 2-3/6 matched: 40-64
- 0-1/6 matched: 10-39
- Also deduct up to 10 pts for poor ATS formatting, gaps, or unprofessional quality
- 90+ is reserved for exceptional CVs only`;

    const userPrompt = `Job Title: ${resolvedTitle}

Job Description:
${resolvedDescription}

CV:
${cvText.slice(0, 6000)}

Analyse carefully and return the JSON with required_skills, matched, missing, and score.`;

    let raw;

    if (groq) {
        // primary provider: Groq (fast, free tier)
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.5,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });
        raw = response.choices[0].message.content.trim();
        console.log(`[scoring] Groq response: ${raw}`);
    } else if (anthropic) {
        // fallback provider: Claude
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });
        raw = response.content[0].text.trim();
        console.log(`[scoring] Claude response: ${raw}`);
    } else {
        console.warn('[scoring] No AI provider configured — set GROQ_API_KEY or ANTHROPIC_API_KEY');
        return null;
    }

    const parsed = JSON.parse(raw);
    const score = Number(parsed.score);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
        console.warn(`[scoring] Invalid score value: ${score}`);
        return null;
    }

    const { error } = await supabase
        .from('candidates')
        .update({ agg_score: score })
        .eq('id', candidateId);

    if (error) {
        console.error('[scoring] Supabase update failed:', error.message);
        return null;
    }

    console.log(`[scoring] agg_score updated to ${score} for candidate ${candidateId}`);
    return score;
};

// score a completed interview based on its Q&A pairs
export const scoreInterview = async (interviewId) => {
    console.log(`[scoring] Starting interview score for ${interviewId}`);

    // fetch interview to get job context
    const { data: interview, error: intErr } = await supabase
        .from('interviews')
        .select('job_id')
        .eq('id', interviewId)
        .maybeSingle();

    if (intErr || !interview) {
        console.error('[scoring] Could not fetch interview:', intErr?.message);
        return null;
    }

    const job = await fetchJobDetails(interview.job_id);
    const jobTitle = job?.title ?? 'the position';
    const jobDescription = job?.description ?? 'Not provided';

    // get all questions and answers for this interview
    const questions = await iQuestionRepo.getByInterviewId(interviewId);
    const answered = questions.filter((q) => q.q_answer);

    if (answered.length === 0) {
        console.warn('[scoring] No answered questions, skipping interview scoring');
        return null;
    }

    // build Q&A text block for the prompt
    const qaPairs = answered.map((q, i) =>
        `Q${i + 1}: ${q.questions.question}\nA${i + 1}: ${q.q_answer}`
    ).join('\n\n');

    const systemPrompt = `You are an expert interviewer evaluating a candidate's interview answers.

Analyse the candidate's answers against the job requirements and return ONLY valid JSON:
{
  "score": <integer 0-100>,
  "comment": "<1-2 sentence summary of the candidate's performance>"
}

Scoring guide:
- 80-100: Excellent — thorough, relevant answers demonstrating strong expertise
- 60-79: Good — solid answers with minor gaps
- 40-59: Average — partial answers, some relevant experience shown
- 20-39: Below average — vague or off-topic answers
- 0-19: Poor — mostly unanswered or completely irrelevant`;

    const userPrompt = `Job Title: ${jobTitle}

Job Description:
${jobDescription}

Interview Q&A:
${qaPairs}

Score the candidate and write a brief comment.`;

    let raw;

    if (groq) {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.5,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });
        raw = response.choices[0].message.content.trim();
        console.log(`[scoring] Groq interview response: ${raw}`);
    } else if (anthropic) {
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });
        raw = response.content[0].text.trim();
        console.log(`[scoring] Claude interview response: ${raw}`);
    } else {
        console.warn('[scoring] No AI provider configured for interview scoring');
        return null;
    }

    // strip markdown code fences that some models wrap around JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const parsed = JSON.parse(cleaned);
    const score = Number(parsed.score);
    const comment = parsed.comment || '';

    if (!Number.isInteger(score) || score < 0 || score > 100) {
        console.warn(`[scoring] Invalid interview score: ${score}`);
        return null;
    }

    // persist score and AI comment to the interviews table
    const { error: updateErr } = await supabase
        .from('interviews')
        .update({ final_score: score, ai_comment: comment })
        .eq('id', interviewId);

    if (updateErr) {
        console.error('[scoring] Interview score update failed:', updateErr.message);
        return null;
    }

    console.log(`[scoring] Interview ${interviewId} scored ${score}: "${comment}"`);
    return { score, comment };
};
