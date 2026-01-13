# ExamPlatform-FE

Vue 3 + Quasar frontend application for examinees to take proctored exams.

## Overview

ExamPlatform-FE is the examinee-facing web application of the ExamPlatform system. It provides a responsive interface for students to:

- Log in using assigned anonymous credentials (ID + key)
- Take exams with various question types (multiple choice, fill-in-the-blank, listening, speaking)
- Submit voice recordings for oral/speaking exams
- Navigate between exam sections with timed constraints

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5+ | Reactive UI framework |
| Quasar | 2.18+ | Component library & CLI |
| Pinia | 3.x | State management |
| TypeScript | 5.9+ | Type safety |
| Vue Router | 4.x | Client-side routing |
| vue-i18n | 11.x | Internationalization |
| Axios | 1.11+ | HTTP client |
| ali-oss | 6.x | Alibaba Cloud OSS uploads |

## Prerequisites

- **Node.js**: v18, v20, v22, v24, v26, or v28
- **npm**: >= 6.13.4 or **yarn**: >= 1.21.1
- Backend API server running (see [ExamPlatform-BE](../ExamPlatform-BE/README.md))

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Bob8259/ExamPlatform-FE.git
cd ExamPlatform-FE
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment

Copy the development environment file and adjust values as needed:

```bash
cp .env.dev .env
```

Environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_SITE` | Backend API URL | `http://localhost:8000` |
| `ALI_BUCKET_EXAM` | Alibaba Cloud OSS bucket for exam files | `sz-ep-exam-file` |
| `ALI_OSS_REGION` | Alibaba Cloud OSS region | `oss-cn-shenzhen` |

### 4. Start Development Server

```bash
npm run dev
# or
quasar dev
```

The app will be available at `http://localhost:9000` (default Quasar port).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (uses `.env.dev`) |
| `npm run dev:test` | Start dev server with test environment |
| `npm run build` | Build for production |
| `npm run build:test` | Build with test environment |
| `npm run lint` | Run ESLint on source files |
| `npm run format` | Format code with Prettier |

## Project Structure

```
src/
├── assets/              # Static assets (images, etc.)
├── boot/                # Quasar boot files (plugins, initialization)
├── components/          # Reusable Vue components
├── css/                 # Global styles
├── i18n/                # Internationalization files
├── layouts/             # Page layouts
├── pages/               # Route page components
├── router/              # Vue Router configuration
├── stores/              # Pinia state stores
└── util/                # Utility functions
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `pages/` | Main view components for each route |
| `stores/` | Pinia stores for `exam`, `paper`, `user` state |
| `util/` | HTTP client (`util-net.ts`), business logic, URL helpers |
| `components/` | Shared components used across pages |

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | `IndexPage.vue` | Login/landing page |
| `/exam` | `ExamPage.vue` | Exam overview and instructions |
| `/headset` | `HeadsetPage.vue` | Audio device check (for listening/speaking exams) |
| `/section` | `SectionPage.vue` | Section navigation and countdown |
| `/question` | `QuestionPage.vue` | Question display and answer submission |
| `/proctor` | `proctor/*` | Proctor management interface (Login, Papers, Schedules) |

## Testing

The project uses **Vitest** for unit/component testing and **Cypress** for E2E testing.

### Unit Tests
Run unit tests for components and logic:
```bash
npx vitest run
```

### E2E Tests
Run end-to-end tests:
```bash
npx cypress run
```

## State Management

The app uses Pinia with three main stores:

- **`user-store`**: Authentication token and user info
- **`exam-store`**: Current exam session, section, answers, and timers
- **`paper-store`**: Exam paper structure (sections, questions)

## Environment Files

| File | Purpose |
|------|---------|
| `.env.dev` | Development configuration (default) |
| `.env.test` | Testing configuration |
| `.env.prod` | Production configuration |

## Code Style

- **ESLint**: Vue + TypeScript recommended rules
- **Prettier**: Single quotes, 100 character width
- **Vue 3**: Composition API with `<script setup>`
- **Imports**: Prefer `import type { ... }` for type-only imports

## Related

- [ExamPlatform-BE](../ExamPlatform-BE/README.md) — Backend API server
- [Quasar Documentation](https://quasar.dev/docs)
