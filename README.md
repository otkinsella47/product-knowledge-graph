# Product Knowledge Graph (PKG)

> An AI-native product knowledge system that models product knowledge as a graph of connected concepts rather than a collection of documents.

## Why?

Product teams do not struggle because information is missing. They struggle because the relationships between pieces of information are often invisible.

Research, insights, opportunities, solutions, decisions and outcomes become fragmented across documents and tools, making context difficult to understand, maintain and reuse.

Product Knowledge Graph aims to make these relationships explicit, navigable and reusable for both humans and AI agents.

## Core Thesis

> Product knowledge is fundamentally relational rather than hierarchical.

Rather than organising information into documents or linear workflows, PKG treats product knowledge as a graph of connected concepts.

## Current Status

**Version:** v0.1 – Validation and Learning

The current goal is to:

1. Define a lightweight domain model
2. Build a simple graph prototype
3. Explore AI-assisted reasoning
4. Validate the concept through rapid iteration and user feedback

## Project Documentation

Repository context lives in `docs/`:

* `PRODUCT_VISION.md`
* `PROJECT_OVERVIEW.md`
* `DOMAIN_MODEL.md`
* `ARCHITECTURE.md`
* `DECISIONS.md`
* `ROADMAP.md`
* `PRINCIPLES.md`
* `USER_PERSONAS.md`
* `AGENT_GUIDE.md`

## Development Workflow

```text
ChatGPT → Planning & Architecture
Codex → Implementation
Manual Review & Testing
```

> Build the simplest version that enables learning.

## Development Setup

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run validation checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
