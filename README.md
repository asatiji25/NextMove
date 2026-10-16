# NextMove — Know what to do next.

NextMove is a responsive student task planner that helps users organize assignments, quizzes, projects, and deadlines. Its central feature is a **Next Move** recommendation that identifies a useful task to work on first based on deadline urgency, priority, and estimated effort.

## Features

- Responsive editorial-style interface for desktop and mobile
- Add tasks with subject, deadline, priority, estimated effort, and notes
- Smart next-task recommendation with a plain-language explanation
- Task overview with total, completed, urgent, and progress counts
- Filter by all, to-do, completed, or urgent tasks
- Sort by smart order, nearest deadline, or highest priority
- Mark tasks complete or return them to the active list
- Delete tasks
- Save tasks in browser `localStorage` so they remain after refresh on the same browser
- Accessible form labels, keyboard focus styles, and reduced-motion support

## Built with

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage

No backend, account, API key, package manager, or build step is required.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For a local development server, you can also use VS Code's Live Server extension, but it is optional.

## Deploy with GitHub Pages

1. Create a new GitHub repository named `nextmove` (or another name you prefer).
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root. Do not upload only the ZIP file.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. Wait for the deployment to finish. GitHub will show the published website URL in the Pages section.

## How the recommendation works

NextMove uses a small transparent scoring rule. Overdue tasks receive the highest urgency, followed by tasks due today and tomorrow. Priority and estimated effort add to the score. The task with the highest score becomes the suggested next move. This is rule-based logic, not AI.

## Data and limitations

- Tasks are stored in the browser's localStorage. They do not sync between devices or browsers.
- Clearing browser data may remove saved tasks.
- The initial sample tasks are illustrative. Users can add, complete, and delete tasks.
- The recommendation is a simple planning aid and should be treated as a suggestion.

## Project structure

```text
nextmove/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Future improvements

- Task dependencies to show which assignments block other tasks
- Optional weekly calendar view
- Export and import tasks
- More flexible time estimates and study sessions
