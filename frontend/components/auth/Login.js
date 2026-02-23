// Backend API base URL for all auth requests - Bora
//TEST MERTCAN

const API_BASE = 'http://localhost:4000/api/v1';

function toggleForms() {
    document.getElementById("loginForm").classList.toggle("hidden");
    document.getElementById("registerForm").classList.toggle("hidden");
}

// Helper to grab input values using data-field attributes instead of ids - Bora
function getField(name) {
    return document.querySelector(`[data-field="${name}"]`).value.trim();
}

// Helper to show success or error messages below the form - Bora
function showMessage(form, text, isError) {
    const el = document.querySelector(`[data-message="${form}"]`);
    el.textContent = text;
    el.style.color = isError ? '#ff4d4d' : '#4dff88';
}

// Handles login form submission and sends credentials to backend - Bora
async function handleLogin(e) {
    e.preventDefault();

    const email = getField('login-email');
    const password = getField('login-password');

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMessage('login', data.error || 'Login failed', true);
            return;
        }

        // Store token and profile in localStorage for authenticated requests later - Bora
        localStorage.setItem('token', data.token);
        localStorage.setItem('company', JSON.stringify(data.profile));

        showMessage('login', 'Login successful! Redirecting...', false);

        // Redirect to dashboard after a short delay - Bora
        setTimeout(() => {
            window.location.href = '../../pages/dashboard/index.html';
        }, 1000);

    } catch (err) {
        showMessage('login', 'Could not connect to server', true);
    }
}

// Handles register form submission with password confirmation check - Bora
async function handleRegister(e) {
    e.preventDefault();

    const name = getField('register-name');
    const email = getField('register-email');
    const password = getField('register-password');
    const confirm = getField('register-confirm');

    if (password !== confirm) {
        showMessage('register', 'Passwords do not match', true);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMessage('register', data.error || 'Registration failed', true);
            return;
        }

        showMessage('register', 'Account created! You can now log in.', false);

        // Switch to login form after successful registration - Bora
        setTimeout(() => toggleForms(), 1500);

    } catch (err) {
        showMessage('register', 'Could not connect to server', true);
    }
}

// Attach form submit handlers once the DOM is ready - Bora
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-form="login"]').addEventListener('submit', handleLogin);
    document.querySelector('[data-form="register"]').addEventListener('submit', handleRegister);
});
