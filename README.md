# Kajun Chicken & Seafood

> Live: [kajun-chicken-and-seafood.vercel.app](https://kajun-chicken-and-seafood.vercel.app)

Menu and ordering interface system for a restaurant platform.

Designed as a structured upgrade focusing on interface clarity, ordering flow, and operational flexibility.

---

## Overview

This project reworks a traditional restaurant website into a more controlled and interactive system.

It emphasizes:

- Menu accessibility and visual clarity
- Smooth ordering experience
- Admin-side configurability
- Consistent behavior across devices

---

## Core Features

- Structured menu system with categorized items
- Cart and checkout interface
- Admin panel for menu and pricing control
- Dynamic item availability
- Responsive design for mobile and desktop

---

## System Scope

- Built with React and Vite
- Component-based UI architecture
- Local and optional external data handling
- GitHub Pages deployment support

---

## Setup

```bash
npm install
cp .env.example .env       # then set your real GROQ_API_KEY
npm run dev
```

The `.env` file is gitignored. The Groq key is read by the
serverless function at `api/kai-chat.js`, never by the browser.

---

## KAI (the AI ordering assistant) — how the key works

KAI's chat goes through a Vercel serverless function at
`/api/kai-chat`. The function reads `GROQ_API_KEY` from the
project's runtime environment and forwards each chat to Groq.

The browser sees no credentials. Per-IP rate limiting (30/hour)
prevents anyone from abusing the public endpoint to drive up the
operator's Groq bill.

A visitor can optionally plug in their own Groq key via the
recovery banner; in that mode the browser hits Groq directly with
the visitor's key (their bill, their request) and the proxy is
bypassed.

---

## Deployment

Deployed on Vercel. Set `GROQ_API_KEY` under Project Settings →
Environment Variables (Production + Preview). Never commit it.

---

## Notes

This is an independent upgrade project and is not officially associated with the original business.

---

## Studio

Developed under Anteroom Studio.

Research and system design by ZAI (Zawwar Sami).
