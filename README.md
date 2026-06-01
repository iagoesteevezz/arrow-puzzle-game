# Arrow Puzzle Game

Arrow Puzzle Game is a minimalist and procedural web puzzle game where logic and precision are everything. It allows players to clear the board by shooting arrows, handling collisions, and progressing through increasingly challenging levels with a hybrid cloud save system.

**Try the application live:** [https://iagoesteevezz.github.io/arrow-puzzle-game](https://iagoesteevezz.github.io/arrow-puzzle-game)

---

## For Users: What can you do with Arrow Puzzle Game?

* **Play infinitely:** Enjoy procedurally generated levels that dynamically scale in difficulty and arrow count as you progress.
* **Play anywhere:** A 100% responsive design that seamlessly adapts its layout and element sizes to both desktop monitors and mobile screens.
* **Never lose your progress:** Play instantly as a guest, or create an account to securely synchronize your highest level to the cloud.
* **Smart Sync:** The game intelligently merges your local and cloud progress, ensuring you always start from your highest achieved level across any device.

---

## For Developers: Architecture and Technologies

The project is structured as a modern, lightweight frontend application optimized for performance without relying on heavy frameworks:

* **Frontend:** Built entirely with **HTML5, CSS3, and Vanilla JavaScript (ES6+)**. It utilizes native CSS variables, Flexbox/Grid, and dynamic DOM manipulation.
* **Backend & Auth:** Integrated natively with **Supabase**. It uses Supabase Auth for lazy registration and PostgreSQL with strict Row Level Security (RLS) to manage user data.
* **State Management & Sync:** Implements a hybrid save system that caches progress in `localStorage` for offline/guest play, synchronizing with the database via async queries when an authenticated session is detected.
* **Responsive Rendering:** Features dynamic scaling algorithms that recalculate vector positions and anchor points (e.g., keeping arrowheads attached to bodies) on the fly to prevent overflow on mobile viewports.

---

## Local Environment Setup

If you want to run or contribute to this project locally, follow these steps:

### 1. Clone the repository
Since this is a Vanilla JS project, no npm installation is required. Just clone the repository:

```bash
git clone https://github.com/iagoesteevezz/arrow-puzzle-game.git
cd arrow-puzzle-game
```

## 2. Environment Variables

To keep credentials secure and separated from the main logic, create a `config.js` file at the root of the project (ensure it is added to your `.gitignore`).

**At the project root (`/config.js`):**

```javascript
const SUPABASE_CONFIG = {
  URL: 'your_supabase_url',
  KEY: 'your_supabase_anon_publishable_key'
};
```

Example `.gitignore` entry:

```gitignore
config.js
```

---

## 3. Database Migrations

Before testing cloud synchronization locally, you must create the database table and security policies in Supabase.

1. Open your Supabase project dashboard.
2. Navigate to **SQL Editor**.
3. Copy and execute the following SQL script:

```sql
create table arrow_game_progress (
  id uuid references auth.users on delete cascade primary key,
  max_level int default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table arrow_game_progress enable row level security;

create policy "Users can insert their own progress"
on arrow_game_progress
for insert
with check (auth.uid() = id);

create policy "Users can view their own progress"
on arrow_game_progress
for select
using (auth.uid() = id);

create policy "Users can update their own progress"
on arrow_game_progress
for update
using (auth.uid() = id);
```

These policies ensure that each authenticated user can only read and modify their own game progress.

---

## 4. Run the Development Server

To avoid CORS issues and ensure JavaScript modules load correctly, serve the project through a local HTTP server instead of opening the `index.html` file directly.

### Option A: VS Code / Cursor (Recommended)

Install the **Live Server** extension and click **"Go Live"**.

### Option B: Python Built-in Server

From the project root, run:

```bash
python -m http.server 5500
```

Then open:

```
http://localhost:5500
```

### Option C: Node.js

If you have Node.js installed:

```bash
npx serve .
```

The application should now be available locally in your browser, with Supabase authentication and cloud synchronization working once the environment variables and database migrations are configured correctly.

---

## Project Structure

```text
arrow-puzzle-game/
│
├── index.html            # Main application entry point
├── style.css             # Global styles and responsive layout
├── script.js             # Core game logic and rendering
├── config.js             # Local Supabase configuration (not committed)
├── README.md
└── assets/               # Icons, images, and static resources
```

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a pull request describing the improvements.

Please keep the codebase lightweight and framework-free unless there is a strong technical justification for introducing additional dependencies.

---

## License

This project is distributed under the MIT License. Feel free to use, modify, and distribute it according to the license terms.
