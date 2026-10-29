/**
 * Project Studio — Main Application Script
 * Modular, accessible JavaScript for the Neo-Brutalist Project Studio UI.
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Constants & Configurations
  // ---------------------------------------------------------------------------
  const STORAGE_KEYS = {
    API_KEYS: 'studio_api_keys_v1',
    SETTINGS: 'studio_settings_v1'
  };

  const MODELS = {
    openai: [
      'gpt-4o (recommended)',
      'gpt-4o-mini',
      'o3-mini',
      'o1'
    ],
    anthropic: [
      'claude-3-7-sonnet (recommended)',
      'claude-3-5-haiku',
      'claude-3-opus'
    ],
    google: [
      'gemini-2.5-pro (recommended)',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ],
    deepseek: [
      'deepseek-chat (V3)',
      'deepseek-reasoner (R1)'
    ]
  };

  const PLACEHOLDER_IDEAS = [
    'a Docker container monitoring dashboard with real-time resource graphs...',
    'a food delivery app for campus canteens with live order tracking...',
    'a collaborative whiteboard with real-time cursors and exportable SVGs...',
    'an AI audio transcription tool with semantic meeting summaries...',
    'an automated personal finance tracker with receipt OCR scanning...'
  ];

  // ---------------------------------------------------------------------------
  // 2. Application State
  // ---------------------------------------------------------------------------
  const state = {
    mode: 'auto', // 'auto' | 'manual'
    provider: 'openai',
    model: MODELS.openai[0],
    depth: 'balanced', // 'quick' | 'balanced' | 'deep'
    attachedFile: null,
    apiKeys: {
      openai: '',
      anthropic: '',
      google: '',
      deepseek: ''
    }
  };

  // ---------------------------------------------------------------------------
  // 3. DOM Element Selectors Helper
  // ---------------------------------------------------------------------------
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const dom = {
    nav: $('#nav'),
    navToggle: $('#navToggle'),
    settingsBtn: $('#settingsBtn'),
    helpBtn: $('#helpBtn'),
    idea: $('#idea'),
    count: $('#count'),
    attachBtn: $('#attachBtn'),
    fileInput: $('#fileInput'),
    attachmentBadge: $('#attachmentBadge'),
    attachmentName: $('#attachmentName'),
    removeAttachmentBtn: $('#removeAttachmentBtn'),
    clearIdeaBtn: $('#clearIdeaBtn'),
    improveBtn: $('#improve'),
    autoCard: $('#autoCard'),
    manualCard: $('#manualCard'),
    providers: $('#providers'),
    modelSelect: $('#model'),
    keyIndicator: $('#keyIndicator'),
    keyLabel: $('#keyLabel'),
    changeKey: $('#changeKey'),
    depth: $('#depth'),
    depthInfoBtn: $('#depthInfoBtn'),
    templates: $('#templates'),
    resultPanel: $('#resultPanel'),
    resultTitle: $('#resultTitle'),
    resultBadge: $('#resultBadge'),
    resultContent: $('#resultContent'),
    resultStats: $('#resultStats'),
    resultModel: $('#resultModel'),
    copyResultBtn: $('#copyResultBtn'),
    downloadResultBtn: $('#downloadResultBtn'),
    useResultBtn: $('#useResultBtn'),
    dismissResultBtn: $('#dismissResultBtn'),
    settingsModal: $('#settingsModal'),
    closeSettingsModal: $('#closeSettingsModal'),
    saveSettingsBtn: $('#saveSettingsBtn'),
    clearKeysBtn: $('#clearKeysBtn'),
    keyOpenAI: $('#keyOpenAI'),
    keyAnthropic: $('#keyAnthropic'),
    keyGoogle: $('#keyGoogle'),
    keyDeepSeek: $('#keyDeepSeek'),
    depthModal: $('#depthModal'),
    closeDepthModal: $('#closeDepthModal'),
    closeDepthBtn: $('#closeDepthBtn'),
    toast: $('#toast')
  };

  // ---------------------------------------------------------------------------
  // 4. Toast Notification Manager
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message, duration = 2400) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // 5. State Persistence & LocalStorage
  // ---------------------------------------------------------------------------
  function loadPersistedState() {
    try {
      const storedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      if (storedKeys) {
        state.apiKeys = { ...state.apiKeys, ...JSON.parse(storedKeys) };
      }
    } catch (e) {
      console.warn('Unable to load stored keys from localStorage:', e);
    }
    updateKeyStatusIndicator();
  }

  function savePersistedKeys() {
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(state.apiKeys));
      showToast('API keys saved locally');
    } catch (e) {
      console.warn('Unable to persist API keys to localStorage:', e);
      showToast('Error saving keys');
    }
    updateKeyStatusIndicator();
  }

  function updateKeyStatusIndicator() {
    const activeKey = state.apiKeys[state.provider];
    const dot = dom.keyIndicator?.querySelector('.key-status-dot');
    if (activeKey && activeKey.trim().length > 0) {
      if (dom.keyLabel) dom.keyLabel.textContent = `${state.provider.toUpperCase()} key connected`;
      if (dot) {
        dot.style.background = 'var(--mint)';
        dot.style.boxShadow = 'none';
      }
    } else {
      if (dom.keyLabel) dom.keyLabel.textContent = 'Demo Key (Configure)';
      if (dot) {
        dot.style.background = 'var(--blue)';
        dot.style.boxShadow = 'none';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Dynamic Typewriter Placeholder in Textarea
  // ---------------------------------------------------------------------------
  function initTypewriterPlaceholder() {
    const textarea = dom.idea;
    if (!textarea) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textarea.placeholder = 'Describe the application you want to build...';
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeTimer = null;

    function typeLoop() {
      if (document.activeElement === textarea || textarea.value.trim().length > 0) {
        typeTimer = setTimeout(typeLoop, 1000);
        return;
      }

      const currentPhrase = PLACEHOLDER_IDEAS[phraseIndex];

      if (isDeleting) {
        charIndex--;
        textarea.placeholder = currentPhrase.substring(0, charIndex);
        if (charIndex <= 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % PLACEHOLDER_IDEAS.length;
          typeTimer = setTimeout(typeLoop, 400);
          return;
        }
        typeTimer = setTimeout(typeLoop, 28);
      } else {
        charIndex++;
        textarea.placeholder = currentPhrase.substring(0, charIndex);
        if (charIndex >= currentPhrase.length) {
          isDeleting = true;
          typeTimer = setTimeout(typeLoop, 2200);
          return;
        }
        typeTimer = setTimeout(typeLoop, 50);
      }
    }

    typeLoop();

    textarea.addEventListener('focus', () => {
      textarea.placeholder = 'Describe the application you want to build...';
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Navigation Bar + Mobile Toggle
  // ---------------------------------------------------------------------------
  function setActiveNav(link) {
    $$('#nav a').forEach(a => {
      a.classList.toggle('active', a === link);
      if (a === link) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function closeMobileNav() {
    if (!dom.nav || !dom.navToggle) return;
    dom.nav.classList.remove('open');
    dom.navToggle.setAttribute('aria-expanded', 'false');
  }

  function initNavigation() {
    if (dom.navToggle && dom.nav) {
      dom.navToggle.addEventListener('click', () => {
        const open = dom.nav.classList.toggle('open');
        dom.navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    if (!dom.nav) return;
    dom.nav.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      if (href.startsWith('#') && href.length > 1) {
        const target = $(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveNav(link);
          closeMobileNav();
          return;
        }
      }

      e.preventDefault();
      setActiveNav(link);
      closeMobileNav();
      showToast(`Switched to ${link.textContent.trim()}`);
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Model Dropdown & Provider Controls
  // ---------------------------------------------------------------------------
  function renderModels() {
    if (!dom.modelSelect) return;
    const providerModels = MODELS[state.provider] || MODELS.openai;
    dom.modelSelect.innerHTML = providerModels
      .map(m => `<option value="${m}">${m}</option>`)
      .join('');
    state.model = providerModels[0];
  }

  function initProviderSelection() {
    if (!dom.providers) return;

    dom.providers.addEventListener('click', e => {
      const btn = e.target.closest('.prov');
      if (!btn) return;

      const providerId = btn.dataset.p;
      if (!providerId || !MODELS[providerId]) return;

      state.provider = providerId;
      $$('.prov', dom.providers).forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });

      renderModels();
      setAiMode('manual');
      updateKeyStatusIndicator();
    });

    if (dom.modelSelect) {
      dom.modelSelect.addEventListener('change', e => {
        state.model = e.target.value;
        setAiMode('manual');
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 9. AI Mode Selection (Auto vs Manual)
  // ---------------------------------------------------------------------------
  function setAiMode(mode) {
    state.mode = mode;
    const isAuto = mode === 'auto';

    if (dom.autoCard) {
      dom.autoCard.classList.toggle('selected', isAuto);
      dom.autoCard.setAttribute('aria-checked', isAuto ? 'true' : 'false');
    }
    if (dom.manualCard) {
      dom.manualCard.classList.toggle('selected', !isAuto);
      dom.manualCard.setAttribute('aria-checked', !isAuto ? 'true' : 'false');
    }
  }

  function initModeSelection() {
    if (dom.autoCard) {
      dom.autoCard.addEventListener('click', () => {
        setAiMode('auto');
        showToast('Auto mode selected: AI selects optimal model');
      });
      dom.autoCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setAiMode('auto');
        }
      });
    }

    if (dom.manualCard) {
      dom.manualCard.addEventListener('click', e => {
        if (e.target.closest('select') || e.target.closest('button')) return;
        setAiMode('manual');
        showToast(`Manual mode: using ${state.provider.toUpperCase()}`);
      });
      dom.manualCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === dom.manualCard) {
            e.preventDefault();
            setAiMode('manual');
          }
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Depth Selector
  // ---------------------------------------------------------------------------
  function initDepthSelector() {
    if (!dom.depth) return;

    dom.depth.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const depthValue = btn.dataset.d;
      if (!depthValue) return;

      state.depth = depthValue;
      $$('#depth button').forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });

      const label = depthValue.charAt(0).toUpperCase() + depthValue.slice(1);
      showToast(`Prompt depth: ${label}`);
    });
  }

  // ---------------------------------------------------------------------------
  // 11. Templates Loading
  // ---------------------------------------------------------------------------
  function initTemplates() {
    if (!dom.templates || !dom.idea) return;

    dom.templates.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn || !btn.dataset.t) return;

      const templateIdea = `Build ${btn.dataset.t}.`;
      dom.idea.value = templateIdea;
      dom.idea.dispatchEvent(new Event('input', { bubbles: true }));
      dom.idea.focus();

      $('#promptSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Template loaded into prompt');
    });
  }

  // ---------------------------------------------------------------------------
  // 12. Textarea Counter & Clear Button
  // ---------------------------------------------------------------------------
  function initTextareaControls() {
    if (!dom.idea) return;

    dom.idea.addEventListener('input', () => {
      const length = dom.idea.value.length;
      if (dom.count) dom.count.textContent = `${length}/2000`;
    });

    if (dom.clearIdeaBtn) {
      dom.clearIdeaBtn.addEventListener('click', () => {
        dom.idea.value = '';
        dom.idea.dispatchEvent(new Event('input', { bubbles: true }));
        dom.idea.focus();
        showToast('Input cleared');
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 13. File Attachment Handling
  // ---------------------------------------------------------------------------
  function initFileAttachment() {
    if (!dom.attachBtn || !dom.fileInput) return;

    dom.attachBtn.addEventListener('click', () => {
      dom.fileInput.click();
    });

    dom.fileInput.addEventListener('change', () => {
      const file = dom.fileInput.files?.[0];
      if (!file) return;

      state.attachedFile = file;
      const sizeKb = Math.round(file.size / 1024);

      if (dom.attachmentName) {
        dom.attachmentName.textContent = `${file.name} (${sizeKb} KB)`;
      }
      if (dom.attachmentBadge) {
        dom.attachmentBadge.hidden = false;
      }
      showToast(`Attached: ${file.name}`);
    });

    if (dom.removeAttachmentBtn) {
      dom.removeAttachmentBtn.addEventListener('click', () => {
        state.attachedFile = null;
        if (dom.fileInput) dom.fileInput.value = '';
        if (dom.attachmentBadge) dom.attachmentBadge.hidden = true;
        showToast('Attachment removed');
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 14. Intelligent Prompt Generator Engine
  // ---------------------------------------------------------------------------
  function generateEnhancedPrompt(userIdea, depth, provider, model) {
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const activeModelName = state.mode === 'auto' ? 'AI Recommended (gpt-4o / claude-3-7-sonnet)' : `${provider.toUpperCase()} (${model})`;

    if (depth === 'quick') {
      return `# Production Application Blueprint: ${userIdea.slice(0, 50)}...
Date: ${timestamp} | Mode: Quick Spark | Engine: ${activeModelName}

## 1. Objective & Core Goal
${userIdea}

## 2. Key User Stories
- As an end user, I want an intuitive, responsive interface with minimal latency and instant feedback.
- As an administrator, I want observability, error diagnostics, and clear data management tools.
- As a visitor, I want fast initial page load (<1.5s), accessible design (WCAG AA), and dark/light mode support.

## 3. Scope & Acceptance Criteria
- Clean separation of UI components, application state, and external service adapters.
- Deterministic form validation with helpful error states.
- Responsive layout adapting seamlessly from 360px mobile viewports to 4K displays.
- Zero external runtime crashes; robust fallback states for network latency or outages.`;
    }

    if (depth === 'balanced') {
      return `# System Architecture & Specification Document
Project: ${userIdea}
Date: ${timestamp} | Mode: Balanced Architecture | Model: ${activeModelName}

---

### Executive Summary
A production-ready application specification engineered for high performance, maintainability, and elegant user experience based on:
"${userIdea}"

---

### 1. Recommended Technology Stack
- **Frontend Framework**: Next.js 15 (React 19, App Router) or Vite + React with TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Radix UI Primitives
- **State Management**: TanStack Query (React Query) for server state + Zustand for client state
- **Backend / Database**: PostgreSQL via Prisma ORM or Supabase Serverless
- **Authentication**: Auth.js (NextAuth) or Clerk with secure session management
- **Deployment**: Docker containerized / Vercel Edge with automated CI/CD pipeline

---

### 2. Core User Flows & Screen Specifications
1. **Landing & Onboarding**:
   - Hero value proposition with interactive preview.
   - 1-click OAuth authentication or email magic link.
2. **Main Workspace / Dashboard**:
   - Real-time responsive layout with collapsible navigation.
   - Primary data grid with sorting, filtering, and optimistic UI updates.
3. **Execution & Detail Views**:
   - Contextual side panels, detail modals, and history timelines.
4. **Settings & Account Management**:
   - API credentials, billing integration, profile preferences, and session revocations.

---

### 3. API Contract & Data Schema
- \`GET /api/v1/items\` — Paginated resource list with cursor support.
- \`POST /api/v1/items\` — Create new record with Zod schema validation.
- \`PATCH /api/v1/items/:id\` — Optimistic attribute update with conflict resolution.
- \`DELETE /api/v1/items/:id\` — Soft delete with audit log entry.

---

### 4. Non-Functional Requirements & Security
- **Performance**: Lighthouse score > 95; sub-100ms interaction times.
- **Security**: Strict CORS headers, CSRF token validation, input sanitization, and rate-limiting.`;
    }

    return `# Enterprise Production Blueprint & Implementation Guide
Specification for: ${userIdea}
Date: ${timestamp} | Mode: Deep Research Blueprint | AI Engine: ${activeModelName}

================================================================================
PART I: SYSTEM ARCHITECTURE & DOMAIN MODEL
================================================================================
1. Architecture Overview:
   - Event-driven modular monolith or microservices architecture.
   - CQRS pattern for read-heavy query optimization with Redis caching layer.
   - Strict TypeScript end-to-end type safety from database schema to frontend hooks.

2. Domain Entities & Database Schema (PostgreSQL):
   - **Users Table**: \`id (UUID)\`, \`email (VARCHAR UNIQUE)\`, \`password_hash\`, \`role (ENUM)\`, \`created_at (TIMESTAMPTZ)\`
   - **Tenants / Workspaces**: \`id (UUID)\`, \`name\`, \`slug\`, \`tier (ENUM)\`, \`created_at\`
   - **Core Resources**: \`id (UUID)\`, \`tenant_id (FK)\`, \`owner_id (FK)\`, \`payload (JSONB)\`, \`status (ENUM)\`, \`version (INT)\`
   - **Audit Logs**: \`id (BIGSERIAL)\`, \`actor_id\`, \`action\`, \`ip_address\`, \`timestamp\`

================================================================================
PART II: API SPECIFICATIONS & INTEGRATION CONTRACTS
================================================================================
- RESTful endpoints adhering to OpenAPI 3.1 specification.
- Idempotency key headers (\`X-Idempotency-Key\`) on all financial or critical state-altering mutations.
- WebSocket or Server-Sent Events (SSE) channel for real-time live synchronization.

================================================================================
PART III: SECURITY, AUTHENTICATION & COMPLIANCE
================================================================================
- Role-Based Access Control (RBAC): \`Viewer\`, \`Editor\`, \`Admin\`, \`SuperAdmin\`.
- Encryption at rest (AES-256) and in transit (TLS 1.3).
- Strict Content Security Policy (CSP), automated rate-limiting via Token Bucket algorithm.

================================================================================
PART IV: PHASED EXECUTION ROADMAP
================================================================================
- Phase 1 (Foundation): Database migrations, auth scaffolding, core data models.
- Phase 2 (MVP Feature Set): Primary dashboard, CRUD operations, state caching.
- Phase 3 (Polish & Integration): Real-time updates, notifications, analytics.
- Phase 4 (Production Readiness): Unit/e2e test suites (Vitest + Playwright), Dockerization, CI/CD.`;
  }

  // ---------------------------------------------------------------------------
  // 15. "Improve My Prompt" Action
  // ---------------------------------------------------------------------------
  function initPromptImprovement() {
    if (!dom.improveBtn || !dom.idea) return;

    dom.improveBtn.addEventListener('click', async () => {
      const text = dom.idea.value.trim();
      if (!text) {
        showToast('Please describe your idea first');
        dom.idea.focus();
        return;
      }

      const btn = dom.improveBtn;
      const spinner = btn.querySelector('.cta-spinner');
      const label = btn.querySelector('.cta-label');

      btn.disabled = true;
      if (spinner) spinner.hidden = false;
      if (label) label.textContent = 'Engineering Prompt...';

      await new Promise(resolve => setTimeout(resolve, 950));

      const enhancedText = generateEnhancedPrompt(text, state.depth, state.provider, state.model);

      if (dom.resultContent) dom.resultContent.textContent = enhancedText;
      if (dom.resultBadge) {
        const depthCapitalized = state.depth.charAt(0).toUpperCase() + state.depth.slice(1);
        dom.resultBadge.textContent = `${depthCapitalized} Blueprint`;
      }
      if (dom.resultModel) {
        dom.resultModel.textContent = `Engine: ${state.mode === 'auto' ? 'AI Recommended' : state.model}`;
      }
      if (dom.resultStats) {
        const words = enhancedText.split(/\s+/).filter(Boolean).length;
        dom.resultStats.textContent = `${words} words • ${enhancedText.length} characters`;
      }

      if (dom.resultPanel) {
        dom.resultPanel.hidden = false;
        dom.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      btn.disabled = false;
      if (spinner) spinner.hidden = true;
      if (label) label.textContent = 'IMPROVE MY PROMPT →';

      showToast('Prompt enhanced successfully!');
    });

    if (dom.copyResultBtn) {
      dom.copyResultBtn.addEventListener('click', async () => {
        const content = dom.resultContent?.textContent || '';
        if (!content) return;
        try {
          await navigator.clipboard.writeText(content);
          showToast('Copied prompt to clipboard!');
          dom.copyResultBtn.innerHTML = '<span class="icon">✓</span> Copied!';
          setTimeout(() => {
            dom.copyResultBtn.innerHTML = '<span class="icon">📋</span> Copy';
          }, 2000);
        } catch (e) {
          showToast('Failed to copy. Please select text manually.');
        }
      });
    }

    if (dom.downloadResultBtn) {
      dom.downloadResultBtn.addEventListener('click', () => {
        const content = dom.resultContent?.textContent || '';
        if (!content) return;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'studio-production-prompt.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded studio-production-prompt.md');
      });
    }

    if (dom.useResultBtn) {
      dom.useResultBtn.addEventListener('click', () => {
        const content = dom.resultContent?.textContent || '';
        if (!content) return;
        dom.idea.value = content;
        dom.idea.dispatchEvent(new Event('input', { bubbles: true }));
        $('#promptSection')?.scrollIntoView({ behavior: 'smooth' });
        dom.idea.focus();
        showToast('Loaded blueprint into prompt textarea');
      });
    }

    if (dom.dismissResultBtn) {
      dom.dismissResultBtn.addEventListener('click', () => {
        if (dom.resultPanel) dom.resultPanel.hidden = true;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 16. Modals: Settings & Depth Info
  // ---------------------------------------------------------------------------
  function initModals() {
    const openSettings = () => {
      if (dom.keyOpenAI) dom.keyOpenAI.value = state.apiKeys.openai || '';
      if (dom.keyAnthropic) dom.keyAnthropic.value = state.apiKeys.anthropic || '';
      if (dom.keyGoogle) dom.keyGoogle.value = state.apiKeys.google || '';
      if (dom.keyDeepSeek) dom.keyDeepSeek.value = state.apiKeys.deepseek || '';
      dom.settingsModal?.showModal();
    };

    dom.settingsBtn?.addEventListener('click', openSettings);
    dom.changeKey?.addEventListener('click', e => {
      e.preventDefault();
      openSettings();
    });

    dom.closeSettingsModal?.addEventListener('click', () => {
      dom.settingsModal?.close();
    });

    dom.saveSettingsBtn?.addEventListener('click', () => {
      state.apiKeys.openai = dom.keyOpenAI?.value.trim() || '';
      state.apiKeys.anthropic = dom.keyAnthropic?.value.trim() || '';
      state.apiKeys.google = dom.keyGoogle?.value.trim() || '';
      state.apiKeys.deepseek = dom.keyDeepSeek?.value.trim() || '';
      savePersistedKeys();
      dom.settingsModal?.close();
    });

    dom.clearKeysBtn?.addEventListener('click', () => {
      state.apiKeys = { openai: '', anthropic: '', google: '', deepseek: '' };
      savePersistedKeys();
      if (dom.keyOpenAI) dom.keyOpenAI.value = '';
      if (dom.keyAnthropic) dom.keyAnthropic.value = '';
      if (dom.keyGoogle) dom.keyGoogle.value = '';
      if (dom.keyDeepSeek) dom.keyDeepSeek.value = '';
      showToast('All API keys cleared');
    });

    [dom.settingsModal, dom.depthModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.close();
      });
    });

    const openDepthInfo = () => dom.depthModal?.showModal();
    dom.depthInfoBtn?.addEventListener('click', openDepthInfo);
    dom.helpBtn?.addEventListener('click', openDepthInfo);
    dom.closeDepthModal?.addEventListener('click', () => dom.depthModal?.close());
    dom.closeDepthBtn?.addEventListener('click', () => dom.depthModal?.close());
  }

  // ---------------------------------------------------------------------------
  // 17. Scroll reveals (once) — CSS-driven, respects reduced motion
  // ---------------------------------------------------------------------------
  function initScrollReveal() {
    const sections = $$('.scroll-reveal');
    if (!sections.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach(el => el.classList.add('is-visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      sections.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    sections.forEach(el => observer.observe(el));
  }

  // ---------------------------------------------------------------------------
  // 18. Application Initialization Entry Point
  // ---------------------------------------------------------------------------
  function init() {
    loadPersistedState();
    renderModels();
    setAiMode('auto');

    initTypewriterPlaceholder();
    initNavigation();
    initProviderSelection();
    initModeSelection();
    initDepthSelector();
    initTemplates();
    initTextareaControls();
    initFileAttachment();
    initPromptImprovement();
    initModals();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
