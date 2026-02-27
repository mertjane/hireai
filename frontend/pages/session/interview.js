// Interview session page — candidate-facing interview flow
(() => {
    'use strict';

    // Use shared API_BASE from config.js (loaded via script tag before this file)

    const DEFAULT_TIMER = 120; // fallback per-question timer in seconds
    const REPLAY_WINDOW = 10000; // TTS replay available for 10s after read
    const TRANSITION_DURATION = 3000; // 3s between questions
    const EARLY_SUBMIT_RATIO = 0.3; // show submit button after 30% of time elapsed
    const BREAK_DURATION = 30; // seconds between questions
    const MIC_TEST_TIMEOUT = 300; // 5-minute mic-test time limit in seconds

    // ---- State ----
    const state = {
        token: null,
        interview: null,
        questions: [],
        currentIndex: 0,
        pinVerified: false,
        countdownInterval: null,
        questionTimerInterval: null,
        questionTimeLeft: 0,
        recognition: null,
        currentTranscript: '',
        hasSpeechSupport: false,
        micTestTimerInterval: null,
        micTestPassed: false,
        breakInterval: null,
    };

    // ---- DOM helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // Show one screen, hide all others
    const showScreen = (name) => {
        $$('.screen').forEach((s) => s.classList.remove('active'));
        const target = $(`[data-screen="${name}"]`);
        if (target) target.classList.add('active');
    };

    // ---- API functions ----
    const api = {
        fetchInterview: async (token) => {
            const res = await fetch(`${API_BASE}/interviews/token/${token}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load interview');
            return res.json();
        },

        fetchQuestions: async (token) => {
            const res = await fetch(`${API_BASE}/interview-questions/token/${token}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load questions');
            return res.json();
        },

        verifyPin: async (token, pin) => {
            const res = await fetch(`${API_BASE}/interviews/token/${token}/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'PIN verification failed');
            return res.json();
        },

        submitAnswer: async (questionId, token, answer) => {
            const res = await fetch(`${API_BASE}/interview-questions/${questionId}/answer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, q_answer: answer }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit answer');
            return res.json();
        },

        completeInterview: async (token) => {
            const res = await fetch(`${API_BASE}/interviews/token/${token}/complete`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to complete interview');
            return res.json();
        },
    };

    // ---- Time helpers ----
    const formatCountdown = (totalSeconds) => {
        if (totalSeconds <= 0) return '00:00:00';
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const formatTimer = (totalSeconds) => {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    // Determine which screen to show based on current time vs scheduled_at
    const getTimeStatus = (scheduledAt) => {
        const now = Date.now();
        const scheduled = new Date(scheduledAt).getTime();
        const diffMs = scheduled - now;
        const diffSeconds = Math.floor(diffMs / 1000);

        // More than 1 hour early
        if (diffSeconds > 3600) return { status: 'too-early', diffSeconds };
        // More than 10 minutes late
        if (diffSeconds < -600) return { status: 'too-late', diffSeconds };
        // Within window — either waiting or ready to start
        if (diffSeconds > 0) return { status: 'waiting', diffSeconds };
        // Interview time has arrived (within 10 min grace)
        return { status: 'ready', diffSeconds };
    };

    // ---- Countdown logic ----
    const startCountdown = () => {
        clearInterval(state.countdownInterval);

        const tick = () => {
            const scheduledAt = state.interview.scheduled_at;
            const { status, diffSeconds } = getTimeStatus(scheduledAt);

            if (status === 'too-late') {
                clearInterval(state.countdownInterval);
                showScreen('too-late');
                return;
            }

            if (diffSeconds <= 0) {
                // Time to start the interview
                clearInterval(state.countdownInterval);
                beginInterview();
                return;
            }

            // Update whichever countdown element is visible
            const display = formatCountdown(diffSeconds);
            const waitingEl = $('#waiting-countdown');
            const verifiedEl = $('#verified-countdown');
            if (waitingEl) waitingEl.textContent = display;
            if (verifiedEl) verifiedEl.textContent = display;
        };

        tick();
        state.countdownInterval = setInterval(tick, 1000);
    };

    // ---- PIN input logic ----
    const initPinInput = () => {
        const boxes = $$('.pin-box');

        boxes.forEach((box, i) => {
            // Handle typed input — move focus to next box
            box.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val.slice(0, 1);

                if (val && i < 5) {
                    boxes[i + 1].focus();
                }

                // Auto-submit when all 6 digits entered
                if (i === 5 && val) {
                    tryVerifyPin();
                }
            });

            // Handle backspace — navigate to previous box
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                    boxes[i - 1].value = '';
                }
            });

            // Handle paste — fill all boxes from pasted string
            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                pasted.split('').forEach((char, idx) => {
                    if (boxes[idx]) boxes[idx].value = char;
                });
                if (pasted.length === 6) {
                    boxes[5].focus();
                    tryVerifyPin();
                } else if (pasted.length > 0) {
                    boxes[Math.min(pasted.length, 5)].focus();
                }
            });
        });

        // Focus first box
        boxes[0].focus();
    };

    const getPinValue = () => {
        return Array.from($$('.pin-box')).map((b) => b.value).join('');
    };

    const tryVerifyPin = async () => {
        const pin = getPinValue();
        if (pin.length !== 6) return;

        const errorEl = $('#pin-error');
        const boxes = $$('.pin-box');

        try {
            await api.verifyPin(state.token, pin);
            state.pinVerified = true;
            showScreen('verified');
            // Countdown continues on the verified screen
            startCountdown();
        } catch (err) {
            // Show error and shake animation
            errorEl.textContent = err.message || 'Invalid PIN';
            boxes.forEach((b) => {
                b.classList.add('error');
                b.value = '';
            });
            boxes[0].focus();
            // Remove shake class after animation
            setTimeout(() => boxes.forEach((b) => b.classList.remove('error')), 400);
        }
    };

    // ---- TTS (Text-to-Speech) ----
    const speakQuestion = (text) => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.onend = resolve;
            utterance.onerror = resolve;
            window.speechSynthesis.speak(utterance);
        });
    };

    // Enable replay button for a limited time
    const enableReplay = (text) => {
        const btn = $('#btn-replay');
        btn.style.display = 'inline-block';
        btn.disabled = false;

        const handler = () => {
            speakQuestion(text);
        };
        btn.addEventListener('click', handler);

        // Disable after replay window
        setTimeout(() => {
            btn.disabled = true;
            btn.removeEventListener('click', handler);
            setTimeout(() => { btn.style.display = 'none'; }, 1000);
        }, REPLAY_WINDOW);
    };

    // ---- STT (Speech-to-Text) ----
    const initSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            state.hasSpeechSupport = false;
            return;
        }
        state.hasSpeechSupport = true;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            state.currentTranscript = transcript;
            $('#transcript').textContent = transcript;
        };

        // Auto-restart on unexpected stop to keep listening
        recognition.onend = () => {
            if (state.questionTimerInterval) {
                try {
                    recognition.start();
                } catch (_) {
                    // Ignore — may fail if page is navigating away
                }
            }
        };

        recognition.onerror = (event) => {
            // Ignore no-speech errors — auto-restart handles it
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.warn('Speech recognition error:', event.error);
            }
        };

        state.recognition = recognition;
    };

    const startListening = () => {
        state.currentTranscript = '';
        $('#transcript').textContent = '';

        if (state.hasSpeechSupport && state.recognition) {
            try {
                state.recognition.start();
            } catch (_) {
                // start() throws if already running — that's fine, mic is still active
            }
            // Always show indicator when we have speech support — mic is working
            $('#recording-indicator').classList.add('active');
            $('#mic-warning').style.display = 'none';
        } else {
            // No speech support — show warning instead of text fallback
            showMicWarning();
        }
    };

    const stopListening = () => {
        if (state.recognition) {
            try {
                state.recognition.stop();
            } catch (_) { /* noop */ }
        }
        $('#recording-indicator').classList.remove('active');
    };

    // Show mic-unavailable warning instead of text fallback
    const showMicWarning = () => {
        $('#mic-warning').style.display = 'block';
        $('#recording-indicator').classList.remove('active');
    };

    // ---- Question timer ----
    const startQuestionTimer = (seconds) => {
        state.questionTimeLeft = seconds;
        const timerEl = $('#question-timer');
        const submitBtn = $('#btn-submit');
        const totalTime = seconds;

        // Hide submit button initially — show after early-submit threshold
        submitBtn.style.display = 'none';

        const tick = () => {
            state.questionTimeLeft--;
            timerEl.textContent = formatTimer(Math.max(0, state.questionTimeLeft));

            // Warning state when under 10 seconds
            if (state.questionTimeLeft <= 10) {
                timerEl.classList.add('warning');
            }

            // Show early submit button after 30% of time has passed
            const elapsed = totalTime - state.questionTimeLeft;
            if (elapsed >= totalTime * EARLY_SUBMIT_RATIO) {
                submitBtn.style.display = 'inline-block';
            }

            // Time's up — auto-submit
            if (state.questionTimeLeft <= 0) {
                clearInterval(state.questionTimerInterval);
                state.questionTimerInterval = null;
                submitCurrentAnswer();
            }
        };

        timerEl.textContent = formatTimer(seconds);
        timerEl.classList.remove('warning');
        state.questionTimerInterval = setInterval(tick, 1000);
    };

    // ---- Answer submission ----
    const submitCurrentAnswer = async () => {
        clearInterval(state.questionTimerInterval);
        state.questionTimerInterval = null;
        stopListening();

        const q = state.questions[state.currentIndex];
        // Only use speech transcript — text fallback removed
        const answer = state.currentTranscript || '(no answer)';

        try {
            await api.submitAnswer(q.id, state.token, answer);
        } catch (err) {
            // Log but continue to next question — network errors shouldn't block flow
            console.error('Failed to submit answer:', err);
        }

        // Move to next question or finish, with break between questions
        state.currentIndex++;
        if (state.currentIndex < state.questions.length) {
            showBreak(state.currentIndex);
        } else {
            finishInterview();
        }
    };

    // ---- Question display flow ----
    const showQuestion = (index) => {
        const q = state.questions[index];
        const questionText = q.questions?.question || 'No question text available';
        const timer = q.q_timer > 0 ? q.q_timer : DEFAULT_TIMER;

        // Update counter
        $('#question-counter').textContent = `Question ${index + 1} / ${state.questions.length}`;

        // Show transition overlay
        const overlay = $('#transition-overlay');
        const transitionText = $('#transition-text');
        transitionText.textContent = `Question ${index + 1}`;
        overlay.classList.add('active');

        setTimeout(async () => {
            overlay.classList.remove('active');

            // Set question text
            $('#question-text').textContent = questionText;
            $('#btn-replay').style.display = 'none';
            $('#btn-submit').style.display = 'none';

            // Read question aloud via TTS
            await speakQuestion(questionText);

            // Enable replay for limited time
            enableReplay(questionText);

            // Start listening and timer
            startListening();
            startQuestionTimer(timer);
        }, TRANSITION_DURATION);
    };

    // Wire up early submit button
    const initSubmitButton = () => {
        $('#btn-submit').addEventListener('click', () => {
            submitCurrentAnswer();
        });
    };

    // ---- 30-second break between questions ----
    const showBreak = (nextIndex) => {
        showScreen('break');
        const total = state.questions.length;
        $('#break-question-counter').textContent = `Next: Question ${nextIndex + 1} / ${total}`;

        let remaining = BREAK_DURATION;
        const fill = $('#break-bar-fill');
        const timerText = $('#break-timer-text');

        // Reset bar to 0%
        fill.style.transition = 'none';
        fill.style.width = '0%';
        // Force reflow so the reset takes effect before re-enabling transition
        fill.offsetWidth;
        fill.style.transition = 'width 1s linear';

        timerText.textContent = remaining;

        const proceed = () => {
            clearInterval(state.breakInterval);
            state.breakInterval = null;
            showScreen('interview');
            showQuestion(nextIndex);
        };

        state.breakInterval = setInterval(() => {
            remaining--;
            // Update bar width as a percentage of total break duration
            const pct = ((BREAK_DURATION - remaining) / BREAK_DURATION) * 100;
            fill.style.width = `${pct}%`;
            timerText.textContent = remaining;

            if (remaining <= 0) {
                proceed();
            }
        }, 1000);

        // Wire up skip button — only add listener once via replacement
        const skipBtn = $('#btn-skip-break');
        const newSkip = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkip, skipBtn);
        newSkip.addEventListener('click', proceed);
    };

    // ---- Mic-test screen ----
    const showMicTest = () => {
        showScreen('mic-test');
        state.micTestPassed = false;

        const previewEl = $('#mic-test-preview');
        const statusEl = $('#mic-test-status');
        const testArea = $('#mic-test-area');
        const startTestBtn = $('#btn-start-test');
        const startIntBtn = $('#btn-start-interview');
        const timerEl = $('#mic-test-timer');

        // Reset UI state
        previewEl.textContent = '';
        statusEl.textContent = '';
        statusEl.classList.remove('success');
        testArea.style.display = 'none';
        startTestBtn.style.display = 'inline-block';
        startIntBtn.disabled = true;

        // 5-minute auto-proceed countdown
        let micTimeLeft = MIC_TEST_TIMEOUT;
        const formatMicTimer = (s) => {
            const m = String(Math.floor(s / 60)).padStart(2, '0');
            const sec = String(s % 60).padStart(2, '0');
            return `Time remaining: ${m}:${sec}`;
        };
        timerEl.textContent = formatMicTimer(micTimeLeft);

        state.micTestTimerInterval = setInterval(() => {
            micTimeLeft--;
            timerEl.textContent = formatMicTimer(micTimeLeft);
            if (micTimeLeft <= 0) {
                // Auto-start interview when time runs out
                clearInterval(state.micTestTimerInterval);
                stopMicTest();
                proceedToInterview();
            }
        }, 1000);

        // Temporary onresult handler for mic test — shows preview and detects speech
        const testOnResult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            previewEl.textContent = transcript;

            // Any detected speech means the mic is working
            if (transcript.trim().length > 0 && !state.micTestPassed) {
                state.micTestPassed = true;
                statusEl.textContent = 'Microphone working!';
                statusEl.classList.add('success');
                startIntBtn.disabled = false;
            }
        };

        // "Start Test" — begin listening with test handler
        startTestBtn.addEventListener('click', () => {
            if (!state.hasSpeechSupport || !state.recognition) {
                // No speech support — show error and let timer auto-proceed
                statusEl.textContent = 'Speech recognition not supported in this browser.';
                statusEl.style.color = 'var(--error)';
                testArea.style.display = 'block';
                startTestBtn.style.display = 'none';
                // Enable start button anyway so candidate can proceed
                startIntBtn.disabled = false;
                return;
            }

            testArea.style.display = 'block';
            startTestBtn.style.display = 'none';

            // Swap to test handler
            state.recognition.onresult = testOnResult;

            // Auto-restart during mic test to keep listening
            state.recognition.onend = () => {
                if (state.micTestTimerInterval) {
                    try { state.recognition.start(); } catch (_) { /* ignore */ }
                }
            };

            try {
                state.recognition.start();
            } catch (_) {
                statusEl.textContent = 'Could not start microphone. Please check permissions.';
                statusEl.style.color = 'var(--error)';
                startIntBtn.disabled = false;
            }
        }, { once: true });

        // "Start Interview" — stop test and proceed
        startIntBtn.addEventListener('click', () => {
            clearInterval(state.micTestTimerInterval);
            stopMicTest();
            proceedToInterview();
        }, { once: true });
    };

    // Stop mic test recognition and restore normal onresult handler
    const stopMicTest = () => {
        if (state.recognition) {
            // Restore normal onresult for interview use
            state.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                state.currentTranscript = transcript;
                $('#transcript').textContent = transcript;
            };
            // No-op onend during teardown to prevent auto-restart race
            state.recognition.onend = () => {};
            try { state.recognition.stop(); } catch (_) { /* noop */ }
            // Restore proper auto-restart handler after stop settles
            state.recognition.onend = () => {
                if (state.questionTimerInterval) {
                    try { state.recognition.start(); } catch (_) { /* ignore */ }
                }
            };
        }
    };

    // Shared helper — transition from mic test to first question
    const proceedToInterview = () => {
        // Skip questions that already have answers (page refresh resilience)
        const unanswered = state.questions.findIndex((q) => !q.q_answer);
        if (unanswered === -1) {
            finishInterview();
            return;
        }
        state.currentIndex = unanswered;
        showScreen('interview');
        showQuestion(state.currentIndex);
    };

    // ---- Interview start ----
    const beginInterview = () => {
        if (!state.pinVerified) {
            // If PIN not verified yet, stay on waiting screen
            return;
        }

        // Skip questions that already have answers (page refresh resilience)
        const unanswered = state.questions.findIndex((q) => !q.q_answer);
        if (unanswered === -1) {
            // All questions already answered
            finishInterview();
            return;
        }

        // Show mic-test screen before starting questions
        showMicTest();
    };

    // ---- Interview completion ----
    const finishInterview = async () => {
        stopListening();
        clearInterval(state.questionTimerInterval);

        try {
            await api.completeInterview(state.token);
        } catch (err) {
            console.error('Failed to mark interview as complete:', err);
        }

        showScreen('completed');
    };

    // ---- Main init ----
    const init = async () => {
        // Extract token from URL query params
        const params = new URLSearchParams(window.location.search);
        state.token = params.get('token');

        if (!state.token) {
            $('#error-message').textContent = 'No interview token provided. Please use the link sent to your email.';
            showScreen('error');
            return;
        }

        try {
            // Fetch interview data and questions in parallel
            const [interview, questions] = await Promise.all([
                api.fetchInterview(state.token),
                api.fetchQuestions(state.token),
            ]);

            state.interview = interview;
            state.questions = questions;

            // If interview is already completed, show completion screen
            if (interview.status === 'completed') {
                showScreen('completed');
                return;
            }

            // Determine which screen to show based on timing
            const { status, diffSeconds } = getTimeStatus(interview.scheduled_at);

            if (status === 'too-early') {
                // Show scheduled date and tell candidate to come back later
                const dateStr = new Date(interview.scheduled_at).toLocaleString(undefined, {
                    dateStyle: 'full',
                    timeStyle: 'short',
                });
                $('#early-date').textContent = dateStr;
                showScreen('too-early');
                return;
            }

            if (status === 'too-late') {
                showScreen('too-late');
                return;
            }

            // Initialize speech recognition for later use
            initSpeechRecognition();
            initSubmitButton();

            if (status === 'ready') {
                // Interview time has arrived — go straight to PIN if not yet verified
                showScreen('waiting');
                initPinInput();
                // Countdown will show 00:00:00 and beginInterview triggers after PIN
                startCountdown();
            } else {
                // Waiting — show countdown + PIN input
                showScreen('waiting');
                initPinInput();
                startCountdown();
            }
        } catch (err) {
            $('#error-message').textContent = err.message || 'Something went wrong.';
            showScreen('error');
        }
    };

    // Boot when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
