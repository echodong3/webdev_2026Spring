# Build a Skill — React Version

Build a Skill is an interactive React web app that turns learning a new skill into a personalized roadmap.

## Features

- React + Vite single-page application
- Skill setup form
- Interactive unlockable skill map
- XP and level system
- AI-generated daily checklist
- Monthly progress calendar
- Daily reflection log
- Dark mode toggle
- Open Library API resource search
- localStorage saving

## API

This project uses the Open Library Search API:

https://openlibrary.org/search.json?q=react&limit=6

The API is used on the Skill Map page to find books/resources related to the user's selected skill.

It also includes an OpenAI-powered Daily Plan generator. The API key stays on the Vite dev server, not in browser code.

1. Create an API key in the OpenAI dashboard.
2. Create a local `.env` file in this folder:

```bash
cp .env.example .env
```

3. Add your key:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

4. Restart the dev server after changing `.env`.

## Run Locally

```bash
npm install
npm run dev
```

## Build for Submission

```bash
npm run build
```

The production files will be in the `dist` folder.
