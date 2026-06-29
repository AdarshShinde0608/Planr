# Planr Workspace Agent Instructions

## Project Overview

This repository contains a full-stack application.

* `client/` → Next.js (App Router)
* `server/` → Express + MongoDB API
* Root workspace manages both applications.

---

# Primary Goal

The current priority is **debugging**, not adding features.

The application opens successfully on localhost, but the frontend continuously refreshes/reloads, making it unusable.

The agent must identify the root cause instead of applying random fixes.

---

# Debugging Process

Before modifying any code, follow this order.

## Step 1 – Identify the refresh source

Determine whether the refresh originates from:

* Next.js Fast Refresh
* React Strict Mode
* Infinite React rendering
* Continuous navigation
* Authentication redirect loop
* Middleware loop
* Router loop
* API polling
* WebSocket reconnect
* Server restart loop
* File watcher repeatedly rebuilding
* Environment variable mismatch

Do not guess.

---

## Step 2 – Inspect the browser

Check:

* Browser Console
* Network tab
* Failed API requests
* Repeated requests
* Redirect chains
* Infinite fetches
* Hydration errors

---

## Step 3 – Inspect the terminal

Check both client and server terminals for:

* Build errors
* Runtime errors
* Restart loops
* Nodemon restarts
* Hot reload messages
* Mongo connection failures

---

## Step 4 – Trace rendering

If React components continuously render:

* Find components re-rendering repeatedly.
* Trace state updates.
* Trace context updates.
* Trace Redux/Zustand updates if used.
* Trace useEffect hooks.

Look specifically for:

* useEffect without dependency arrays
* Effects updating state every render
* Infinite state updates
* Recursive component rendering

---

## Step 5 – Trace routing

Inspect:

* middleware.ts
* layout.tsx
* page.tsx
* route handlers
* authentication guards
* redirects
* router.push()
* router.replace()
* redirect()

Ensure no redirect loop exists.

---

## Step 6 – Trace API calls

Look for:

* useEffect repeatedly fetching
* React Query refetch loops
* SWR refresh intervals
* Polling intervals
* Axios interceptors causing retries

---

## Step 7 – Authentication

Inspect authentication flow.

Check for loops involving:

* JWT validation
* Session refresh
* Cookie parsing
* Token expiration
* Login redirects

---

## Step 8 – Server

Inspect Express for:

* Restart loops
* Database reconnect loops
* Cron jobs
* Scheduled tasks
* Socket reconnects
* Middleware recursion

---

# Editing Rules

Only modify files that contribute to the issue.

Avoid unnecessary refactoring.

Keep changes minimal.

Preserve existing architecture.

---

# When Making Changes

For every modification provide:

1. Root cause
2. Why it happens
3. Files changed
4. Exact code changed
5. Why the fix works
6. Possible side effects

---

# If Root Cause Is Unknown

Do NOT make speculative edits.

Instead:

* gather evidence
* explain findings
* narrow the cause
* propose the smallest next debugging step

---

# Workspace Structure

client/

* Next.js App Router
* UI components
* layouts
* pages
* middleware

server/

* Express
* MongoDB
* Controllers
* Services
* Routes
* Authentication
* AI Integration

---

# Run Commands

Install dependencies

npm run install-all

Backend

npm run dev-server

Frontend

npm run dev-client

---

# Important

The objective is **finding the actual cause of continuous localhost refreshes**, not simply suppressing symptoms.

Prefer diagnosis over workaround.
