# Course Tools

> A fast, student-friendly suite of academic calculators and problem-solving aids

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black.svg)](https://nextjs.org/docs/app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tools](https://img.shields.io/badge/Tools-8-green.svg)](#tool-catalog)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

**Course Tools** makes common coursework tasks faster with reliable, focused tools for linear algebra, calculus, and computer science. It keeps the interface simple, produces clean results, and adds optional AI explanations where helpful.

## Table of Contents

- [Why Course Tools?](#why-course-tools)
- [Design Principles](#design-principles)
- [How to Use the Tools](#how-to-use-the-tools)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Core Systems](#core-systems)
  - [Tool Catalog](#tool-catalog)
  - [AI Explanations](#ai-explanations)
  - [Rate Limiting](#rate-limiting)
- [Roadmap](#roadmap)
- [Installation](#installation)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Why Course Tools?

Academic workflows are full of repeatable, mechanical tasks. Course Tools focuses on the high-friction steps and removes them.

| Problem | Solution |
|---------|----------|
| Manual matrix operations | Fast matrix utilities and multiplication |
| Slow calculus checks | Derivative + integral calculators with clean outputs |
| Big-O guesswork | Pattern-based and AI-assisted complexity analysis |
| Too much UI noise | A single, consistent UI across all tools |

The goal is simple: save time without hiding the math.

---

## Design Principles

| Principle | What It Means |
|-----------|---------------|
| **Clarity over cleverness** | Results are readable and precise |
| **Consistency** | Common UI patterns across every tool |
| **Fast feedback** | Browser-first where possible; API only when needed |
| **Trustworthy math** | mathjs for computation, careful rounding for FP noise |
| **Scalable architecture** | Add new tools without redesigning the app |

---

## How to Use the Tools

Just open a tool, paste your input, and run it. Each tool is designed to be self-contained with minimal configuration.

### Example Inputs

| Tool | Example |
|------|---------|
| Derivative | `sin(x^2) + 3x` |
| Integral | `exp(-x^2)` with bounds `0..1` |
| Matrix Multiply | `[[1,2],[3,4]]` and `[[5,6],[7,8]]` |
| Big-O | `for i in range(n): for j in range(n): ...` |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      COURSE TOOLS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │ Tool Pages   │──▶│ UI Components│──▶│  Styling     │  │
│  │ (App Router) │   │  (React)     │   │ (Tailwind)   │  │
│  └──────────────┘   └──────────────┘   └──────────────┘  │
│           │                     │               │       │
│           ▼                     ▼               ▼       │
│  ┌───────────────────────────────────────────────────┐  │
│  │                 Calculation Layer                 │  │
│  │   mathjs + deterministic helpers + rounding       │  │
│  └───────────────────────────────────────────────────┘  │
│           │
│           ▼
│  ┌───────────────────────────────────────────────────┐  │
│  │                 Optional AI Layer                 │  │
│  │   OpenAI API for explanations + reasoning         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Core Systems

### Tool Catalog

**Linear Algebra**
- Matrix utilities (determinant, transpose)
- Matrix multiplication
- Matrix inverse
- Eigenvalues and eigenvectors

**Calculus**
- Derivative calculator with explanations
- Integral calculator (definite/indefinite)

**Computer Science**
- Big-O complexity analyzer
- Number base converter (binary/oct/dec/hex)

**Planned**
- Limits and series tools
- Chemistry calculators
- Proofs and logic helpers

---

### AI Explanations

Some tools can call an OpenAI-backed endpoint to generate step-by-step explanations. This is optional and rate-limited to keep costs predictable.

---

### Rate Limiting

OpenAI endpoints are protected with IP-based rate limiting:

- 30 requests per 15 minutes per IP
- Public access (no accounts required)

---

## Roadmap

**Short Term**
- Add limits, series, and graphing tools
- Expand chemistry helpers
- More CS utilities (regex tester, data structures)

**Medium Term**
- Step-by-step derivations for more tools
- Export to PDF/LaTeX
- Local history for recent calculations

**Long Term**
- Accounts and saved preferences
- Shareable calculation links
- Mobile-focused UI

---

## Installation

```bash
git clone <your-repo-url>
cd course-tools
npm install
```

---

## Configuration

Create `.env.local` with:

```
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=optional_model_name
```

---

## Contributing

Contributions are welcome. Open an issue or submit a PR with a clear description of the tool or fix.

---

## License

[MIT](LICENSE)

---

**Course Tools**: a focused toolkit for the tasks students do every day.
