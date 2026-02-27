// Shared frontend config — auto-detects production vs development environment
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Railway backend URL in production, localhost in dev
const API_BASE = isLocal
    ? 'http://localhost:4000/api/v1'
    : 'https://hireai-production-af3f.up.railway.app/api/v1';
