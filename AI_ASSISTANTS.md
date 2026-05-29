# AI Assistant Guide for ascii-art-generator

This project is a small React + Vite web app for generating ASCII art from an uploaded image. This document explains how to use GitHub Copilot and Claude Code effectively when working on the project.

## Project overview

- `index.html` — HTML entry point.
- `src/main.tsx` — React bootstrap.
- `src/App.tsx` — main UI and ASCII generation logic.
- `src/index.css` — app styling.
- `package.json` — dependencies and scripts.
- `vite.config.ts` — Vite configuration.
- `tsconfig.json` / `tsconfig.node.json` — TypeScript settings.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal.

## How to use GitHub Copilot

- Open a file like `src/App.tsx` and start typing a comment or function signature.
- Use Copilot suggestions for UI elements, event handlers, and canvas image processing.
- Accept relevant multiline completions, then review and test them in the browser.

### Suggested prompts for Copilot

- "Create an image upload field and display the selected file name."
- "Add buttons for 3 output sizes and 5 detail levels."
- "Generate ASCII art from a canvas pixel buffer with brightness mapping."
- "Add error handling for unsupported image uploads."

## How to use Claude Code

Claude Code can help refine UI/UX, generate documentation, and suggest improvements to the ASCII conversion algorithm.

### Useful Claude Code tasks

- Review the ASCII art generation algorithm and suggest better character mapping.
- Create accessible UI improvements for keyboard users.
- Generate a small `README.md` or feature documentation for the app.
- Suggest optimizations for canvas rendering and resizing behavior.

### Recommended prompts for Claude Code

- "Review this React component and improve the image-to-ASCII conversion logic."
- "Suggest a clean layout for an ASCII art generator with upload, size, and detail controls."
- "Write a section of documentation describing how to add a download button for generated ASCII text."

## Instrument guidance

When making changes, keep the project small and browser-first:

- Use client-side only logic for image upload and processing.
- Keep the UI responsive and mobile-friendly.
- Preserve the 3 size options and 5 detail options as requested.
- Test each change by uploading a real image and verifying the preview updates.

## Notes for contributors

- If you add new features, update this document with the new workflow.
- Use `npm run build` to validate production output after major changes.
- Keep the `package.json` dependencies minimal and compatible with Vite + React.

## Quick commands

```bash
npm install
npm run dev
npm run build
```
