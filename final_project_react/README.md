# Build a Skill — React Version

Build a Skill is an interactive React web app that turns learning a new skill into a personalized roadmap.

## Features

- React + Vite single-page application
- Skill setup form
- Interactive unlockable skill map
- XP and level system
- Daily checklist
- Monthly progress calendar
- Local forum simulation
- Daily reflection log
- Dark mode toggle
- Open Library API resource search
- localStorage saving

## API

This project uses the Open Library Search API:

https://openlibrary.org/search.json?q=react&limit=6

The API is used on the Skill Map page to find books/resources related to the user's selected skill.

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
