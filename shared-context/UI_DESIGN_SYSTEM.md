# 🎨 SiderHub - Design System & UI Guidelines

## 📋 Visão Geral

O SiderHub segue a identidade visual do **fórum Blacksider Society**, mantendo a estética **dark, tech, cyber** com o icônico verde neon como cor de destaque.

**Princípios de Design**:
- 🌑 **Dark Mode First** - Interface escura como padrão
- ⚡ **High Contrast** - Verde neon vibrante sobre fundos escuros
- 🎯 **Cyberpunk/Hacker Aesthetic** - Visual tech, moderno, misterioso
- 📱 **Responsive** - Mobile-first approach
- ♿ **Accessible** - WCAG 2.1 AA compliance

---

## 🎨 Paleta de Cores

### Cores Principais

```css
/* Primary Colors */
--color-primary: #00FF00;           /* Verde Neon - Principal */
--color-primary-dark: #00CC00;      /* Verde Neon Escuro - Hover */
--color-primary-light: #39FF14;     /* Verde Neon Claro - Highlights */
--color-primary-glow: rgba(0, 255, 0, 0.3); /* Glow effect */

/* Backgrounds */
--color-bg-primary: #0A0A0A;        /* Fundo principal - Preto */
--color-bg-secondary: #1A1A1A;      /* Fundo cards/containers */
--color-bg-tertiary: #2A2A2A;       /* Fundo hover states */
--color-bg-elevated: #151515;       /* Modals, dropdowns */

/* Text Colors */
--color-text-primary: #FFFFFF;      /* Texto principal - Branco */
--color-text-secondary: #B3B3B3;    /* Texto secundário - Cinza claro */
--color-text-tertiary: #808080;     /* Texto terciário - Cinza médio */
--color-text-disabled: #4D4D4D;     /* Texto desabilitado */

/* Accent Colors */
--color-accent-success: #00FF00;    /* Sucesso - Verde neon */
--color-accent-warning: #FFD700;    /* Aviso - Amarelo */
--color-accent-error: #FF3333;      /* Erro - Vermelho */
--color-accent-info: #00BFFF;       /* Info - Azul ciano */

/* Borders & Dividers */
--color-border-primary: #2A2A2A;    /* Bordas padrão */
--color-border-accent: #00FF00;     /* Bordas em destaque */
--color-border-subtle: #1A1A1A;     /* Bordas sutis */

/* Overlays */
--color-overlay: rgba(0, 0, 0, 0.8);        /* Backdrop de modals */
--color-overlay-light: rgba(0, 0, 0, 0.4);  /* Overlay leve */
```

### Gradientes

```css
/* Gradientes para elementos especiais */
--gradient-primary: linear-gradient(135deg, #00FF00 0%, #39FF14 100%);
--gradient-dark: linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 100%);
--gradient-neon: linear-gradient(90deg, 
  rgba(0, 255, 0, 0) 0%, 
  rgba(0, 255, 0, 0.3) 50%, 
  rgba(0, 255, 0, 0) 100%
);

/* Glassmorphism (para cards especiais) */
--glass-bg: rgba(26, 26, 26, 0.7);
--glass-border: rgba(0, 255, 0, 0.2);
--glass-blur: blur(10px);
```

### Sombras & Glow Effects

```css
/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.7);

/* Neon Glow Effects */
--glow-sm: 0 0 5px rgba(0, 255, 0, 0.5);
--glow-md: 0 0 10px rgba(0, 255, 0, 0.6), 
           0 0 20px rgba(0, 255, 0, 0.3);
--glow-lg: 0 0 15px rgba(0, 255, 0, 0.7), 
           0 0 30px rgba(0, 255, 0, 0.4),
           0 0 45px rgba(0, 255, 0, 0.2);

/* Text Glow */
--text-glow: 0 0 10px rgba(0, 255, 0, 0.8),
             0 0 20px rgba(0, 255, 0, 0.5);
```

---

## 📝 Tipografia

### Fontes

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-heading: 'Rajdhani', 'Inter', sans-serif; /* Alternativa: 'Orbitron', 'Exo 2' */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

/* Importar no CSS */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Escala de Tamanhos

```css
/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Letter Spacing */
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

### Hierarquia de Texto

```css
/* Headings */
h1, .heading-1 {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  text-transform: uppercase; /* Estilo Blacksider */
  color: var(--color-primary);
  text-shadow: var(--text-glow); /* Glow effect */
}

h2, .heading-2 {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text-primary);
}

h3, .heading-3 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--color-text-primary);
}

h4, .heading-4 {
  font-family: var(--font-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
}

/* Body Text */
p, .body-text {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

/* Small Text */
.text-small, small {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

/* Labels & Tags */
.label {
  font-family: var(--font-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--color-primary);
}

/* Code/Mono */
code, .code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-bg-tertiary);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  color: var(--color-primary);
}
```

---

## 🧩 Componentes

### Botões

```css
/* Primary Button (Verde Neon) */
.btn-primary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 12px 24px;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--glow-sm);
}

.btn-primary:hover {
  background: var(--color-primary);
  color: var(--color-bg-primary);
  box-shadow: var(--glow-md);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Secondary Button */
.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-accent);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 12px 24px;
  font-family: var(--font-primary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  color: var(--color-primary);
  background: rgba(0, 255, 0, 0.1);
}

/* Icon Button */
.btn-icon {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}
```

### Cards

```css
/* Card Base */
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  padding: 24px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--color-border-accent);
  box-shadow: var(--glow-sm);
  transform: translateY(-2px);
}

/* Card com ícone (estilo do fórum) */
.card-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-icon:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  box-shadow: var(--glow-sm);
}

.card-icon__icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.card-icon__title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.card-icon__description {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-tight);
}

/* Glass Card (para elementos especiais) */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}
```

### Inputs & Forms

```css
/* Input Base */
.input {
  width: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  padding: 12px 16px;
  font-family: var(--font-primary);
  font-size: var(--text-base);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--glow-sm);
}

.input::placeholder {
  color: var(--color-text-disabled);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Textarea */
.textarea {
  resize: vertical;
  min-height: 120px;
}

/* Select */
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300FF00'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
}

/* Checkbox */
.checkbox {
  width: 20px;
  height: 20px;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.checkbox:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: var(--glow-sm);
}

/* Label */
.label {
  display: block;
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

/* Input Group */
.input-group {
  margin-bottom: 20px;
}

/* Error State */
.input.error {
  border-color: var(--color-accent-error);
}

.input-error-message {
  font-size: var(--text-xs);
  color: var(--color-accent-error);
  margin-top: 4px;
}
```

### Navigation

```css
/* Navbar */
.navbar {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.navbar__container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--color-primary);
  text-decoration: none;
  text-shadow: var(--text-glow);
}

.navbar__links {
  display: flex;
  gap: 32px;
  align-items: center;
}

.navbar__link {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.navbar__link:hover {
  color: var(--color-primary);
}

.navbar__link.active {
  color: var(--color-primary);
}

.navbar__link.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  box-shadow: var(--glow-sm);
}

/* Sidebar (para navegação secundária) */
.sidebar {
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  padding: 24px;
  overflow-y: auto;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--color-text-secondary);
  border-radius: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.sidebar__item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.sidebar__item.active {
  background: rgba(0, 255, 0, 0.1);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
}
```

### Badges & Tags

```css
/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-family: var(--font-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border-radius: 12px;
  white-space: nowrap;
}

.badge--primary {
  background: rgba(0, 255, 0, 0.15);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.badge--success {
  background: rgba(0, 255, 0, 0.15);
  color: var(--color-accent-success);
}

.badge--warning {
  background: rgba(255, 215, 0, 0.15);
  color: var(--color-accent-warning);
}

.badge--error {
  background: rgba(255, 51, 51, 0.15);
  color: var(--color-accent-error);
}

/* Tag */
.tag {
  display: inline-block;
  padding: 6px 12px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: 4px;
  border: 1px solid var(--color-border-primary);
  transition: all 0.3s ease;
}

.tag:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

### Modals & Overlays

```css
/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

/* Modal */
.modal {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--glow-lg), var(--shadow-xl);
  animation: slideUp 0.3s ease;
  position: relative;
  z-index: 9999;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.modal__title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  color: var(--color-primary);
}

.modal__close {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s ease;
}

.modal__close:hover {
  color: var(--color-primary);
  transform: rotate(90deg);
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: var(--glow-md), var(--shadow-lg);
  min-width: 300px;
  animation: slideInRight 0.3s ease;
  z-index: 10000;
}

.toast--success {
  border-color: var(--color-accent-success);
}

.toast--error {
  border-color: var(--color-accent-error);
}

.toast--warning {
  border-color: var(--color-accent-warning);
}
```

### Loading States

```css
/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Skeleton Loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar__fill {
  height: 100%;
  background: var(--gradient-primary);
  box-shadow: var(--glow-sm);
  transition: width 0.3s ease;
}
```

---

## 🎭 Animações

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In Right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse Glow (para CTAs importantes) */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: var(--glow-sm);
  }
  50% {
    box-shadow: var(--glow-lg);
  }
}

.pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Hover Float */
.hover-float {
  transition: transform 0.3s ease;
}

.hover-float:hover {
  transform: translateY(-4px);
}
```

---

## 📐 Espaçamento & Layout

### Spacing Scale

```css
/* Spacing (Tailwind-inspired) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Grid System

```css
/* Container */
.container {
  max-width: var(--container-2xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }

/* Flex */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 { gap: var(--space-2); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
```

---

## 🖼️ Ícones

**Biblioteca Recomendada**: [Lucide Icons](https://lucide.dev/) ou [Phosphor Icons](https://phosphoricons.com/)

**Estilo**: Outline style, stroke width 2px, cor verde neon

```jsx
// Exemplo com Lucide React
import { Zap, Shield, Database, Code } from 'lucide-react';

<Zap 
  size={24} 
  color="#00FF00" 
  strokeWidth={2}
/>
```

**Ícones principais para o SiderHub**:
- Home: `Home`
- Academia: `GraduationCap`, `BookOpen`
- Hidra: `Smartphone`, `MessageSquare`
- Cybervault: `Archive`, `FolderOpen`
- Admin: `Settings`, `Shield`
- Usuário: `User`, `UserCircle`
- Notificações: `Bell`
- Busca: `Search`
- Menu: `Menu`
- Fechar: `X`

---

## 📱 Responsividade

### Breakpoints

```css
/* Breakpoints */
--breakpoint-xs: 475px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1440px;

/* Media Queries */
@media (max-width: 640px) {
  /* Mobile */
}

@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet */
}

@media (min-width: 1025px) {
  /* Desktop */
}
```

### Mobile-First Approach

```css
/* Base styles para mobile */
.grid-responsive {
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## ♿ Acessibilidade

### Focus States

```css
/* Focus visible para navegação por teclado */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: var(--glow-sm);
}

/* Remover outline padrão do browser */
*:focus {
  outline: none;
}

/* Focus para botões */
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### ARIA Labels

```jsx
// Sempre adicionar ARIA labels
<button 
  aria-label="Fechar modal"
  onClick={handleClose}
>
  <X size={20} />
</button>

<input 
  type="text"
  aria-label="Buscar cursos"
  aria-describedby="search-hint"
/>
<span id="search-hint" className="sr-only">
  Digite para buscar cursos disponíveis
</span>
```

---

## 🎨 Temas Específicos por Seção

### Homepage (Hub)
- **Destaque**: Banners grandes com glow effect
- **Grid de Cards**: 4 colunas desktop, 2 tablet, 1 mobile
- **Ícones**: Verde neon, 48px, com glow

### Academia
- **Player de Vídeo**: Border verde neon, controles customizados
- **Sidebar de Aulas**: Background secundário, hover com glow
- **Comentários**: Estilo de thread, avatares com border neon

### Hidra
- **Dashboard**: Cards de métricas com números grandes em verde
- **Wizard**: Steps com indicador de progresso em verde
- **Tabela de Campanhas**: Hover row com background highlight

### Cybervault
- **Grid de Recursos**: Cards com preview e ícone de tipo de arquivo
- **Filtros**: Tags clicáveis com border verde
- **Download Button**: Verde neon com glow ao hover

### Painel Admin
- **Sidebar Fixa**: Background mais escuro, itens com hover
- **Forms**: Inputs com validação inline
- **Tables**: Zebra striping sutil, ações inline

---

## 🖥️ Exemplos de Layouts

### Layout Principal (3 colunas)

```
┌────────────────────────────────────────────┐
│          NAVBAR (fixo no topo)             │
├──────────┬─────────────────────┬───────────┤
│          │                     │           │
│ SIDEBAR  │   MAIN CONTENT      │  WIDGETS  │
│ (280px)  │   (flex-1)          │  (320px)  │
│          │                     │           │
│ Fixo     │   Scroll            │  Fixo     │
│          │                     │           │
└──────────┴─────────────────────┴───────────┘
```

### Layout Academia (Player + Lista)

```
┌────────────────────────────────────────────┐
│               BREADCRUMB                   │
├─────────────────────────┬──────────────────┤
│                         │                  │
│   VIDEO PLAYER          │   PRÓXIMAS       │
│   (16:9 ratio)          │   AULAS          │
│                         │                  │
├─────────────────────────┤   (320px)        │
│   TÍTULO + DESCRIÇÃO    │                  │
│                         │   Scroll         │
│   ANEXOS                │                  │
│                         │                  │
│   COMENTÁRIOS           │                  │
│   (thread style)        │                  │
│                         │                  │
└─────────────────────────┴──────────────────┘
```

---

## 🎯 Componentes Específicos do Blacksider

### Logo/Brand

```jsx
// Logo com glow effect
<div className="logo">
  <span className="logo__text">
    BLACK
    <span className="logo__accent">SIDER</span>
  </span>
</div>

<style>
.logo__text {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: white;
}

.logo__accent {
  color: var(--color-primary);
  text-shadow: var(--text-glow);
}
</style>
```

### Mascote (Caveira com Capuz)

- Usar como avatar padrão
- Ícone de loading animado
- Easter egg em áreas especiais
- Marca d'água sutil em backgrounds

---

## 📦 Implementação com Tailwind + Shadcn

### tailwind.config.js

```javascript
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00FF00',
        'primary-dark': '#00CC00',
        'primary-light': '#39FF14',
        
        bg: {
          primary: '#0A0A0A',
          secondary: '#1A1A1A',
          tertiary: '#2A2A2A',
          elevated: '#151515',
        },
        
        text: {
          primary: '#FFFFFF',
          secondary: '#B3B3B3',
          tertiary: '#808080',
          disabled: '#4D4D4D',
        },
        
        border: {
          primary: '#2A2A2A',
          accent: '#00FF00',
          subtle: '#1A1A1A',
        },
        
        accent: {
          success: '#00FF00',
          warning: '#FFD700',
          error: '#FF3333',
          info: '#00BFFF',
        }
      },
      
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Rajdhani', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      boxShadow: {
        'glow-sm': '0 0 5px rgba(0, 255, 0, 0.5)',
        'glow-md': '0 0 10px rgba(0, 255, 0, 0.6), 0 0 20px rgba(0, 255, 0, 0.3)',
        'glow-lg': '0 0 15px rgba(0, 255, 0, 0.7), 0 0 30px rgba(0, 255, 0, 0.4), 0 0 45px rgba(0, 255, 0, 0.2)',
        'text-glow': '0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.5)',
      },
      
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 0, 0.5)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 255, 0, 0.7), 0 0 30px rgba(0, 255, 0, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## ✅ Checklist de Implementação

- [ ] Configurar Tailwind com variáveis customizadas
- [ ] Importar fontes (Inter, Rajdhani, JetBrains Mono)
- [ ] Instalar Lucide Icons
- [ ] Criar componentes base com Shadcn (Button, Card, Input, etc)
- [ ] Configurar tema dark como padrão
- [ ] Implementar sistema de glow effects
- [ ] Criar animações customizadas
- [ ] Testar contraste WCAG 2.1 AA
- [ ] Implementar focus states acessíveis
- [ ] Criar Storybook com todos os componentes (opcional)

---

## 📚 Recursos

**Inspiração de Design**:
- Cyberpunk UI/UX
- Hacker aesthetics
- Gaming interfaces
- Neon themes

**Ferramentas**:
- [Figma](https://figma.com) - Design e protótipos
- [Coolors](https://coolors.co) - Paletas de cores
- [Lucide Icons](https://lucide.dev) - Biblioteca de ícones
- [TailwindCSS](https://tailwindcss.com) - Framework CSS
- [Shadcn/ui](https://ui.shadcn.com) - Componentes

---

**Última atualização**: 02/11/2025  
**Versão**: 1.0  
**Status**: 🟢 Completo
