# Interview App — Improvements Changelog

Structured list of all improvements, grouped by category. Each entry includes what was done, why, and which files were touched.

---

## Theme System

### Dual-theme support (Soft Dark + Clean Light)
- **What:** Replaced hardcoded hex colors with CSS custom properties. Created two complete color palettes — a Vercel/GitHub-inspired dark theme and a Notion/Linear-inspired light theme. All Tailwind color classes now reference CSS variables, so the entire UI updates when the theme changes.
- **Why:** The original deep-blue palette felt too "AI dashboard". The new themes are neutral, professional, and minimal.
- **Files:** `tailwind.config.js`, `src/index.css`

### Theme toggle button
- **What:** Sun/moon icon button fixed in the top-right corner. Persists preference to localStorage and applies `data-theme` attribute on `<html>` before first paint to prevent flash.
- **Why:** Lets candidates pick whichever mode is comfortable for their environment.
- **Files:** `src/contexts/ThemeContext.tsx` (new), `src/components/ThemeToggle.tsx` (new), `src/main.tsx`

---

## Security Hardening

### Token stripped from URL after extraction
- **What:** After reading `?token=`, `window.history.replaceState` removes it from the address bar.
- **Why:** Prevents token leakage via browser history, referer headers, or screenshots.
- **Files:** `src/App.tsx`

### PIN brute-force protection
- **What:** After 3 failed PIN attempts, input locks with escalating cooldowns (3s → 10s → 30s). "Too many attempts" message shown, inputs disabled during lockout.
- **Why:** Prevents automated or manual brute-force on the 6-digit PIN.
- **Files:** `src/App.tsx`, `src/components/screens/WaitingScreen.tsx`, `src/components/PinInput.tsx`

### Token revocation check
- **What:** Checks `interview.token_revoke === true` after fetch and blocks access.
- **Why:** Ensures revoked interview links cannot be reused.
- **Files:** `src/App.tsx`

### Double-submit protection
- **What:** Submit button disables after first click with a loading spinner. Prevents duplicate submissions.
- **Why:** Network latency could cause candidates to click multiple times.
- **Files:** `src/components/screens/QuestionScreen.tsx`

### Page close warning
- **What:** `beforeunload` event listener warns candidates when they try to close or navigate away during an active interview (mic test, question, or break screens).
- **Why:** Prevents accidental loss of an in-progress interview.
- **Files:** `src/App.tsx`

---

## Resilience & Edge Cases

### Answer retry queue with offline support
- **What:** Failed answer submissions are queued in memory. Flushed automatically on `online` event and every 30 seconds. Local question state is updated immediately for UI consistency.
- **Why:** Ensures no answers are silently dropped due to network issues.
- **Files:** `src/lib/api.ts`, `src/App.tsx`

### Offline/online detection banner
- **What:** Fixed top banner when offline: "You are offline. Answers will be saved and sent when reconnected." Shows "Back online" success message for 3 seconds on reconnect.
- **Why:** Clear connectivity feedback so candidates don't panic.
- **Files:** `src/components/ConnectionBanner.tsx` (new), `src/App.tsx`

### Browser compatibility check
- **What:** Checks for `SpeechRecognition` API before loading interview data. Shows Chrome requirement error if unsupported.
- **Why:** Prevents confusion on Firefox, older Safari, etc.
- **Files:** `src/App.tsx`

### Empty transcript warning
- **What:** Warning appears at 50% of question timer if no speech has been detected: "We can't hear you. Check your microphone."
- **Why:** Early alert so candidates can fix mic issues before time runs out.
- **Files:** `src/components/screens/QuestionScreen.tsx`

### Silence detection
- **What:** If no new speech is detected for 15 consecutive seconds during a question, a "Are you still there?" warning appears.
- **Why:** Catches situations where mic stops picking up audio mid-answer.
- **Files:** `src/components/screens/QuestionScreen.tsx`

### Error screen retry button
- **What:** "Try Again" button on error screen reloads the page.
- **Why:** Clear recovery path instead of a dead end.
- **Files:** `src/components/screens/ErrorScreen.tsx`

### Mic denied recovery
- **What:** Permission-specific instructions and "Retry Microphone" button on MicTestScreen.
- **Why:** Permission errors need distinct recovery steps vs generic mic failures.
- **Files:** `src/components/screens/MicTestScreen.tsx`

---

## UX — Pre-Interview

### Welcome / instructions screen
- **What:** New screen shown after data loads and before the waiting room. Shows question count, format description, environment tips, and Chrome recommendation. Personalized greeting if backend returns candidate/company/job info.
- **Why:** Candidates need to know what to expect before starting.
- **Files:** `src/components/screens/WelcomeScreen.tsx` (new), `src/types.ts`, `src/App.tsx`

### Candidate info display
- **What:** Optional `candidate_name`, `company_name`, `job_title` fields on Interview type. Shown on WelcomeScreen when available.
- **Why:** Personalizes the experience and confirms they're in the right interview.
- **Files:** `src/types.ts`, `src/components/screens/WelcomeScreen.tsx`

---

## UX — During Interview

### Stepper progress bar
- **What:** Fixed top bar showing all questions as circles connected by lines. Answered = green checkmark, current = accent highlight, upcoming = dimmed. Visible on question, break, and completed screens.
- **Why:** Gives candidates a clear sense of progress.
- **Files:** `src/components/StepperBar.tsx` (new), `src/App.tsx`

### Answer confirmation dialog
- **What:** Clicking "Submit Answer" opens a modal showing a preview of the transcript, with "Submit" and "Keep talking" buttons.
- **Why:** Prevents accidental early submissions.
- **Files:** `src/components/ConfirmDialog.tsx` (new), `src/components/screens/QuestionScreen.tsx`

### Last 30 seconds toast
- **What:** Warning toast pops up at the bottom when 30 seconds remain on a question timer.
- **Why:** Candidates focused on speaking may not notice the timer.
- **Files:** `src/components/Toast.tsx` (new), `src/components/screens/QuestionScreen.tsx`

### Camera preview
- **What:** Optional floating webcam preview in the bottom-left corner. Toggled via a camera icon button. No recording — just a mirror so candidates can see themselves.
- **Why:** Helps candidates feel more prepared and self-aware, similar to video call tools.
- **Files:** `src/components/CameraPreview.tsx` (new), `src/App.tsx`

### Keyboard shortcuts
- **What:** `Enter` to submit answer (opens confirmation), `R` to replay question during replay window. `Enter`/`Space` to start mic test, skip break, and proceed through screens. Shortcut hints shown on buttons.
- **Why:** Power users and accessibility — not everyone wants to click.
- **Files:** `src/components/screens/QuestionScreen.tsx`, `src/components/screens/MicTestScreen.tsx`, `src/components/screens/BreakScreen.tsx`

### "Don't close this tab" notice
- **What:** Small text on VerifiedScreen after PIN verification.
- **Why:** Prevents candidates from navigating away while waiting.
- **Files:** `src/components/screens/VerifiedScreen.tsx`

---

## UX — Post-Interview

### Feedback form
- **What:** 5-star rating widget on CompletedScreen. Stores rating in localStorage. Shows "Thanks for your feedback" after submission.
- **Why:** Collects candidate experience data for improvement.
- **Files:** `src/components/screens/CompletedScreen.tsx`

---

## Accessibility

### ARIA labels on all screens
- **What:** Added `role="main"`, `aria-label` on every section, `aria-live="polite"` on dynamic content (timer, recording status), `aria-hidden="true"` on decorative icons, `role="alert"` on error messages and warnings, `role="dialog"` and `aria-modal` on ConfirmDialog.
- **Why:** Screen reader compatibility for visually impaired candidates.
- **Files:** All screen components, `src/components/ConfirmDialog.tsx`, `src/components/StepperBar.tsx`

---

## UI / Visual Polish

### Theme-aware glass cards
- **What:** `.glass-card` uses CSS variables for background and border, so it looks correct in both dark and light themes.
- **Files:** `src/index.css`

### Theme-aware animated background
- **What:** Gradient mesh background uses CSS variables and adjusts opacity per theme.
- **Files:** `src/index.css`

### Animations
- **What:** `slide-up`, `glow`, `float`, `scale-in`, `shimmer` keyframes. Glow animation references accent CSS variable so it adapts to the active theme.
- **Files:** `tailwind.config.js`

### Screen-level polish
- All screens use `glass-card` + `animate-slide-up`
- LoadingScreen: double-ring counter-rotating spinner
- TooEarlyScreen / TooLateScreen: floating icon animation
- VerifiedScreen: scale-in checkmark
- WaitingScreen: glass-card around PIN area
- MicTestScreen: wave bars when listening
- QuestionScreen: wave bars + glass transcript area
- BreakScreen: gradient progress bar + pulsing countdown
- CompletedScreen: confetti celebration + scale-in checkmark

### PinInput focus glow
- **What:** Active input gets a colored shadow. Smooth `transition-all`. Disabled state supported.
- **Files:** `src/components/PinInput.tsx`

### Countdown digit boxes
- **What:** Each digit in its own rounded box with glow. Colons rendered separately.
- **Files:** `src/components/Countdown.tsx`

### TransitionOverlay scale + glow
- **What:** Text uses `animate-scale-in` with accent drop-shadow.
- **Files:** `src/components/TransitionOverlay.tsx`

---

## Bug Fixes

### Token persistence across page reloads
- **What:** Token is now saved to `sessionStorage` on first visit. On reload, if the URL no longer has `?token=`, it reads from sessionStorage.
- **Why:** Stripping the token from the URL for security caused it to be lost on refresh.
- **Files:** `src/App.tsx`

### Question timer progress bar
- **What:** Replaced the static divider line under the question header with an animated progress bar that fills as time elapses. Turns red in the last 10 seconds.
- **Why:** Gives a visual sense of time passing beyond just the countdown number.
- **Files:** `src/components/screens/QuestionScreen.tsx`

### Stepper bar centering
- **What:** Step circles are always centered regardless of whether candidate info is present.
- **Why:** Without candidate info (backend doesn't return names yet), the stepper was left-aligned.
- **Files:** `src/components/StepperBar.tsx`

### Note: Candidate/company name in stepper
- **What:** StepperBar supports `candidateName` and `companyName` props. Currently the backend only returns IDs without joins, so this displays nothing until the backend adds Supabase relation queries.
- **Files:** `src/components/StepperBar.tsx`, `src/App.tsx`, `src/types.ts`

---

## Files Created (7)
- `src/contexts/ThemeContext.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/StepperBar.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/components/Toast.tsx`
- `src/components/CameraPreview.tsx`
- `src/components/screens/WelcomeScreen.tsx`

## Files Modified (18)
- `tailwind.config.js`
- `src/index.css`
- `src/main.tsx`
- `src/types.ts`
- `src/lib/api.ts`
- `src/App.tsx`
- `src/components/PinInput.tsx`
- `src/components/Countdown.tsx`
- `src/components/TransitionOverlay.tsx`
- `src/components/ConnectionBanner.tsx`
- `src/components/screens/LoadingScreen.tsx`
- `src/components/screens/ErrorScreen.tsx`
- `src/components/screens/TooEarlyScreen.tsx`
- `src/components/screens/TooLateScreen.tsx`
- `src/components/screens/WaitingScreen.tsx`
- `src/components/screens/VerifiedScreen.tsx`
- `src/components/screens/MicTestScreen.tsx`
- `src/components/screens/QuestionScreen.tsx`
- `src/components/screens/BreakScreen.tsx`
- `src/components/screens/CompletedScreen.tsx`
