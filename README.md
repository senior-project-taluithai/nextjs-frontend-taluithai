# Taluithai - Frontend

Taluithai is an AI-powered travel planner for exploring Thailand. This repository contains the frontend application built with Next.js.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) with React 19 (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [TanStack React Query](https://tanstack.com/query/latest)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/), LangChain
- **Maps**: [Leaflet](https://leafletjs.com/) & React Leaflet

## Prerequisites

- Node.js 20 or higher
- [pnpm](https://pnpm.io/) package manager

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory and configure your API keys (e.g., OpenAI, OpenRouter) as needed by the AI SDK.

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The main AI Planner interface is located at `/ai-planner`.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable React components, including the customized UI elements from shadcn/ui.
- `hooks/`: Custom React hooks for state and lifecycle management.
- `lib/`: Utility functions, helpers, and configurations.
- `public/`: Static assets like images and fonts.

## Scripts

- `pnpm dev`: Starts the local development server.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Runs the built production application.
- `pnpm lint`: Runs ESLint to catch syntax and style issues.
