const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, Header, Footer, PositionalTab,
  PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader,
  TabStopType, TabStopPosition, ExternalHyperlink
} = require('docx');
const fs = require('fs');

// ────── COLORS & BORDERS ──────
const C = {
  purple:   '6C63FF',
  darkBg:   '1A1A2E',
  cardBg:   '0F3460',
  green:    '22C55E',
  orange:   'F59E0B',
  red:      'EF4444',
  blue:     '3B82F6',
  teal:     '14B8A6',
  gray:     '6B7280',
  lightGray:'F3F4F6',
  white:    'FFFFFF',
  black:    '111827',
  accent:   'A78BFA',
  dark:     '1E1B4B',
  border:   'E5E7EB',
  rowAlt:   'F8F7FF',
  heading:  '2D2B55',
  text:     '374151',
  muted:    '6B7280',
  code:     '1E293B',
  codeText: 'A3E635',
  yellow:   'FBBF24',
  purple2:  '7C3AED',
  indigo:   '4F46E5',
};

const brd = (color) => ({ style: BorderStyle.SINGLE, size: 4, color });
const borders = (c) => ({ top: brd(c), bottom: brd(c), left: brd(c), right: brd(c) });
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ────── HELPERS ──────
const sp = (n) => new TextRun({ text: '', size: n });
const gap = (pts = 200) => new Paragraph({ spacing: { before: pts, after: 0 }, children: [sp(4)] });

const bold = (text, size = 22, color = C.black) => new TextRun({ text, bold: true, size, color, font: 'Arial' });
const reg  = (text, size = 22, color = C.text) => new TextRun({ text, size, color, font: 'Arial' });
const italic = (text, size = 22, color = C.muted) => new TextRun({ text, italics: true, size, color, font: 'Arial' });
const mono = (text, size = 18, color = C.codeText) => new TextRun({ text, font: 'Courier New', size, color });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.purple, space: 6 } },
  children: [new TextRun({ text, bold: true, size: 40, color: C.heading, font: 'Arial' })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 120 },
  children: [new TextRun({ text, bold: true, size: 32, color: C.dark, font: 'Arial' })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, size: 26, color: C.purple, font: 'Arial' })],
});

const para = (children, spacing = { before: 60, after: 120 }) =>
  new Paragraph({ spacing, children });

const txt = (text, size = 22, color = C.text) =>
  new Paragraph({ spacing: { before: 60, after: 120 }, children: [reg(text, size, color)] });

// Bullet paragraph
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 40, after: 60 },
  children: [reg(text, 22, C.text)],
});

const numbered = (text, level = 0) => new Paragraph({
  numbering: { reference: 'numbers', level },
  spacing: { before: 40, after: 60 },
  children: [reg(text, 22, C.text)],
});

// Q&A pair
const qaQ = (qtext) => new Paragraph({
  spacing: { before: 180, after: 60 },
  shading: { fill: 'EEF2FF', type: ShadingType.CLEAR },
  indent: { left: 200 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.purple } },
  children: [
    new TextRun({ text: '🎯 Q: ', bold: true, size: 22, color: C.purple, font: 'Arial' }),
    new TextRun({ text: qtext, bold: true, size: 22, color: C.dark, font: 'Arial' }),
  ],
});

const qaA = (text) => new Paragraph({
  spacing: { before: 60, after: 100 },
  indent: { left: 400 },
  children: [
    new TextRun({ text: '✅ A: ', bold: true, size: 22, color: C.green, font: 'Arial' }),
    new TextRun({ text, size: 22, color: C.text, font: 'Arial' }),
  ],
});

const tip = (text) => new Paragraph({
  spacing: { before: 100, after: 100 },
  shading: { fill: 'FFFBEB', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.yellow } },
  indent: { left: 200, right: 200 },
  children: [
    new TextRun({ text: '💡 TIP: ', bold: true, size: 20, color: C.yellow, font: 'Arial' }),
    new TextRun({ text, size: 20, color: C.text, font: 'Arial' }),
  ],
});

const warn = (text) => new Paragraph({
  spacing: { before: 100, after: 100 },
  shading: { fill: 'FFF1F2', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.red } },
  indent: { left: 200, right: 200 },
  children: [
    new TextRun({ text: '⚠️ WATCH OUT: ', bold: true, size: 20, color: C.red, font: 'Arial' }),
    new TextRun({ text, size: 20, color: C.text, font: 'Arial' }),
  ],
});

const codeBlock = (...lines) => new Paragraph({
  spacing: { before: 80, after: 80 },
  shading: { fill: '1E293B', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.purple } },
  indent: { left: 200, right: 200 },
  children: lines.flatMap((line, i) => [
    new TextRun({ text: line, font: 'Courier New', size: 18, color: C.codeText }),
    ...(i < lines.length - 1 ? [new TextRun({ text: '', break: 1 })] : []),
  ]),
});

// Simple info table — 2 columns
const infoTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3000, 6360],
  rows: rows.map(([left, right, isHeader = false]) => new TableRow({
    children: [
      new TableCell({
        borders: borders(C.border),
        shading: { fill: isHeader ? C.dark : C.rowAlt, type: ShadingType.CLEAR },
        width: { size: 3000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 160, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({ text: left, bold: isHeader, size: 20, color: isHeader ? C.white : C.dark, font: 'Arial' })],
        })],
      }),
      new TableCell({
        borders: borders(C.border),
        shading: { fill: isHeader ? C.dark : C.white, type: ShadingType.CLEAR },
        width: { size: 6360, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text: right, size: 20, color: isHeader ? C.white : C.text, font: 'Arial' })],
        })],
      }),
    ],
  })),
});

// Feature card as a styled paragraph box
const featureCard = (icon, title, desc) => new Paragraph({
  spacing: { before: 100, after: 60 },
  shading: { fill: 'F5F3FF', type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 16, color: C.purple } },
  indent: { left: 240, right: 240 },
  children: [
    new TextRun({ text: icon + ' ', size: 24, font: 'Arial' }),
    new TextRun({ text: title + ' — ', bold: true, size: 22, color: C.dark, font: 'Arial' }),
    new TextRun({ text: desc, size: 22, color: C.text, font: 'Arial' }),
  ],
});

// Section divider
const divider = () => new Paragraph({
  spacing: { before: 200, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
  children: [],
});

// PAGE BREAK
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ────── DOCUMENT CONTENT ──────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { size: 22 } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } }, run: { size: 22 } } },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { size: 22 } } },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: 'Arial', color: C.heading },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: C.dark },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: C.purple },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            spacing: { before: 0, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.purple } },
            children: [
              new TextRun({ text: 'DSA Judge — Complete Interview Prep Report', bold: true, size: 18, color: C.purple, font: 'Arial' }),
              new TextRun({ text: '   |   Prepared for Technical Interviews', size: 18, color: C.muted, font: 'Arial' }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            spacing: { before: 80, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'DSA Judge Interview Report  |  Page ', size: 18, color: C.muted, font: 'Arial' }),
              new TextRun({ text: "", size: 18, color: C.muted, font: 'Arial' }),
            ],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════════
        //  COVER PAGE
        // ═══════════════════════════════════════════════
        new Paragraph({
          spacing: { before: 1440, after: 200 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '🏆', size: 96, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 160 },
          children: [new TextRun({ text: 'DSA Judge', bold: true, size: 72, color: C.purple, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: 'Complete Interview Preparation Report', bold: true, size: 36, color: C.dark, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 320 },
          children: [new TextRun({ text: 'A Full-Stack Online Judge Platform — Everything You Need to Ace Your Interview', italics: true, size: 24, color: C.muted, font: 'Arial' })],
        }),
        divider(),
        infoTable([
          ['Project', 'DSA Judge — Online Coding Platform', true],
          ['Live URL', 'https://dsa-judge.vercel.app'],
          ['Tech Stack', 'Next.js · Express.js · PostgreSQL · Redis · BullMQ · TypeScript'],
          ['Languages', 'C++ · Java · Python · JavaScript'],
          ['Role', 'Full-Stack Developer (with AI assistance)'],
          ['Report Goal', 'Understand the project deeply enough to answer any interview question about it'],
        ]),
        gap(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 0 },
          children: [new TextRun({ text: '📌 How to use this report:', bold: true, size: 22, color: C.dark, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 0 },
          children: [new TextRun({ text: 'Read it end-to-end once. Then before your interview, re-read the Q&A sections.', italics: true, size: 22, color: C.muted, font: 'Arial' })],
        }),
        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 1 — WHAT IS THIS PROJECT?
        // ═══════════════════════════════════════════════
        h1('1. What is DSA Judge? (In Simple Words)'),
        txt('Imagine you want to build your own version of LeetCode — a website where people can solve coding problems, write code in a browser, click "Submit", and get a result like "Accepted" or "Wrong Answer". That is exactly what DSA Judge is.'),
        txt('You built this from scratch (with AI help). It includes:'),
        bullet('A website (frontend) where users can see problems, write code, and submit it.'),
        bullet('A server (backend) that receives the code, runs it safely, and gives back a result.'),
        bullet('A database that stores users, problems, test cases, and submissions.'),
        bullet('A job queue that makes code execution happen in the background.'),
        bullet('Redis (fast memory storage) that caches results so the app feels instant.'),
        bullet('An AI assistant that can give hints, review your code, and help debug.'),
        gap(80),
        txt('The key difference from a basic project: when a user submits code, the server does NOT run it immediately. Instead, it puts the job in a queue (like a task list), a separate "worker" program picks it up and runs the code, then the result is saved. The frontend keeps asking the server "is it done yet?" until the verdict arrives. This is called an asynchronous system, and it is a very professional pattern used by real companies.'),
        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 2 — ARCHITECTURE
        // ═══════════════════════════════════════════════
        h1('2. How Does the Project Work? (Architecture)'),
        txt('Think of the project like a restaurant:'),
        bullet('The Frontend (Next.js) = The waiter who takes your order and shows you the menu.'),
        bullet('The Backend API (Express.js) = The manager who coordinates everything.'),
        bullet('The Worker = The actual chef who cooks the food (runs your code).'),
        bullet('The Database (PostgreSQL) = The order book where everything is recorded.'),
        bullet('Redis = A sticky note board — fast, temporary storage for recent results.'),
        bullet('BullMQ = The ticket system between the manager and the chef.'),
        gap(60),
        h3('Step-by-Step: What Happens When You Click "Submit"'),
        numbered('You write code in the browser (Monaco Editor — same editor as VS Code).'),
        numbered('You click Submit. The frontend sends the code to the backend using an HTTP POST request.'),
        numbered('The backend creates a record in the database: "Submission #123, status = PENDING".'),
        numbered('The backend puts a job in the BullMQ queue: "Hey worker, please judge this code."'),
        numbered('The backend immediately replies to the frontend: "OK, job created, here is submission ID #123."'),
        numbered('The frontend starts polling: every 2 seconds it asks the backend "what is the status of #123?"'),
        numbered('Meanwhile, the worker picks up the job from the queue.'),
        numbered('The worker compiles and runs the code against all test cases (using g++, javac, or python).'),
        numbered('The worker saves the result in Redis (fast) and updates the database.'),
        numbered('Next time the frontend polls, the backend finds the result in Redis and returns it.'),
        numbered('The frontend shows the verdict: Accepted, Wrong Answer, TLE, etc.'),
        gap(80),
        tip('This async pattern is VERY important for interviews. The reason: code execution can take 1-3 seconds or more. If we ran it synchronously (blocking), the HTTP request would time out, and users would see errors. By using a queue, the request returns instantly, and results come later.'),
        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 3 — TECH STACK
        // ═══════════════════════════════════════════════
        h1('3. Technologies Used — Simple Explanations'),

        // 3.1 Next.js
        h2('3.1 Next.js (Frontend Framework)'),
        txt('Next.js is built on top of React. React lets you build UI as components (like Lego blocks). Next.js adds extra features on top of React:'),
        bullet('File-based routing: a file at src/app/problems/page.tsx becomes the /problems page automatically.'),
        bullet('Server-Side Rendering (SSR): pages can be rendered on the server before sending to the browser — faster first load.'),
        bullet('App Router: a newer way to organize pages using layouts and server components.'),
        gap(40),
        codeBlock(
          'Example: This project has these pages:',
          '  /                → Homepage (src/app/page.tsx)',
          '  /problems        → Problem list (src/app/problems/page.tsx)',
          '  /problems/[slug] → Single problem (src/app/problems/[slug]/page.tsx)',
          '  /login           → Login page (src/app/login/page.tsx)',
          '  /admin           → Admin dashboard (src/app/admin/page.tsx)',
        ),
        gap(60),
        tip('"[slug]" in the filename means it is a dynamic route. The word inside the brackets changes based on the URL. For example, /problems/two-sum — here "two-sum" is the slug.'),
        qaQ('What is the App Router in Next.js?'),
        qaA('App Router is a new routing system in Next.js where each folder inside "app/" represents a URL path, and the page.tsx file is what gets shown. It also supports layouts (shared UI around pages) and server components (code that runs on the server only, not in the browser).'),

        // 3.2 Express
        gap(80),
        h2('3.2 Express.js (Backend API Framework)'),
        txt('Express.js is a minimal web framework for Node.js. It lets you create a server that listens for HTTP requests and sends back responses. Think of it as the doorman of a hotel — it receives requests and routes them to the right department.'),
        gap(40),
        codeBlock(
          'Example from this project (index.js):',
          '  app.use("/api/auth",        authRoutes)       // Login, Register',
          '  app.use("/api/problems",    problemRoutes)    // List, get, create problems',
          '  app.use("/api/submissions", submissionRoutes) // Submit code, poll result',
          '  app.use("/api/ai",          aiRoutes)         // AI hints, reviews',
          '  app.get("/health", ...)                       // Health check',
        ),
        qaQ('What is REST API and how did you use it?'),
        qaA('REST (Representational State Transfer) is a set of rules for how web servers should respond to requests. In this project, the backend has endpoints like POST /api/auth/login (create a session), GET /api/problems (get all problems), POST /api/submissions (submit code). GET is used for fetching data, POST for creating/sending data, PUT for updating, DELETE for removing. Each endpoint is a "resource" URL that the frontend talks to.'),
        qaQ('What HTTP status codes did you use?'),
        qaA('200 = success, 201 = created (used after register/submit), 400 = bad request (missing fields), 401 = unauthorized (no token), 403 = forbidden (wrong role), 404 = not found, 409 = conflict (email already exists), 500 = server error. Using correct status codes is important so the frontend can handle errors properly.'),

        // 3.3 PostgreSQL + Prisma
        gap(80),
        h2('3.3 PostgreSQL + Prisma ORM (Database)'),
        txt('PostgreSQL is a relational database — data is stored in tables (like spreadsheets) with rows and columns. Tables can be related to each other using IDs. This project has these main tables:'),
        gap(40),
        infoTable([
          ['Table', 'What It Stores', true],
          ['User', 'Name, email, hashed password, role (FREE/ENROLLED/ADMIN)'],
          ['Problem', 'Title, description, difficulty, test cases, hints, editorial'],
          ['Submission', 'User ID, problem ID, code, language, verdict, score, passed cases'],
          ['TestCase', 'Input, expected output, explanation, whether it is a sample'],
          ['Streak', 'Current streak, longest streak, last solved date per user'],
          ['Bookmark', 'Which user bookmarked which problem'],
          ['Badge', 'Badges earned by users'],
          ['ScalingInput', 'Inputs of different sizes used to measure time complexity'],
        ]),
        gap(80),
        txt('Prisma is an ORM (Object-Relational Mapping) tool. Instead of writing raw SQL, you write JavaScript/TypeScript code and Prisma translates it to SQL for you.'),
        codeBlock(
          '// Instead of writing SQL like:',
          '// SELECT * FROM problems WHERE slug = "two-sum"',
          '',
          '// You write Prisma like:',
          'const problem = await prisma.problem.findUnique({ where: { slug: "two-sum" } })',
        ),
        qaQ('What is an ORM and why use it?'),
        qaA('ORM stands for Object-Relational Mapper. It is a library that lets you interact with a database using the programming language you are already in, instead of writing SQL. Prisma is the ORM used here. Benefits: code is easier to read and write, Prisma catches type errors at compile time (since this uses TypeScript), and you get auto-completion in your editor. Downside: for very complex queries, raw SQL can be faster and more flexible.'),
        qaQ('What is a unique constraint? Where is it used?'),
        qaA('A unique constraint means a column cannot have the same value twice. In this project, email in the User table must be unique (no two users can have the same email). Also, each user can bookmark a problem only once — there is a @@unique([userId, problemId]) constraint on the Bookmark table. The database enforces this automatically.'),

        // 3.4 Redis
        gap(80),
        h2('3.4 Redis (In-Memory Cache)'),
        txt('Redis is like a giant dictionary stored in RAM (your computer\'s working memory, not hard disk). It is incredibly fast — reading from Redis takes microseconds, while reading from a PostgreSQL database takes milliseconds. Redis is used here for two things:'),
        bullet('Caching submission results: After the worker processes a submission, it saves the result in Redis with a key like "result:submission-id". When the frontend polls, the backend checks Redis first before hitting the database. If found there, the response is instant.'),
        bullet('Caching problem data: Problem details are cached with a 10-minute expiry so the database is not hit on every page view.'),
        gap(40),
        codeBlock(
          'How Redis works in this project (redis.js):',
          '  setResult(submissionId, data, ttl=3600)',
          '  → saves to key "result:abc123" in Redis for 1 hour',
          '',
          '  getResult(submissionId)',
          '  → reads from "result:abc123" in Redis',
          '  → returns null if not found or expired',
        ),
        qaQ('What is the difference between a cache and a database?'),
        qaA('A database (PostgreSQL) is permanent, stored on disk, and survives server restarts. A cache (Redis) is temporary, stored in memory (RAM), and can be lost on restart. A cache stores copies of frequently-needed data for fast access. You always write to the database first, and you use the cache to avoid reading from the database repeatedly. If the cache is empty ("cache miss"), you fetch from the database and then fill the cache.'),
        qaQ('What is TTL?'),
        qaA('TTL stands for Time To Live. It is the number of seconds after which a key in Redis is automatically deleted. In this project, submission results are stored with TTL of 3600 seconds (1 hour). After 1 hour, the key disappears. This prevents Redis from filling up with old data. If the frontend tries to get a result after 1 hour, it falls back to reading from the database.'),

        // 3.5 BullMQ
        gap(80),
        h2('3.5 BullMQ (Job Queue)'),
        txt('BullMQ is a library that manages a queue of background jobs. It works on top of Redis. Think of it like a restaurant ticket system: the cashier (API) creates a ticket (job) for each order, and the kitchen (worker) processes tickets one by one.'),
        gap(40),
        codeBlock(
          'How the queue works:',
          '  // API creates a job:',
          '  await submissionQueue.add("judge", {',
          '    submissionId, code, language, testCases, ...',
          '  })',
          '',
          '  // Worker processes it:',
          '  new Worker("submission-queue", async (job) => {',
          '    // run code, evaluate, save result',
          '  }, { concurrency: 3 })',
        ),
        bullet('concurrency: 3 means the worker can process 3 submissions at the same time.'),
        bullet('attempts: 2 means if a job fails, it retries once.'),
        bullet('backoff: exponential means it waits longer between retries (2s, then 4s).'),
        qaQ('Why not just run the code directly in the API route instead of using a queue?'),
        qaA('Because running code takes time (compile + execute can take 1-5 seconds). If the API waits for this, the HTTP request would time out and the user would see an error. By using a queue, the API immediately returns "accepted, here is your submission ID" and the code runs in the background. The frontend polls for the result. This also means if the server crashes mid-execution, BullMQ can retry the job automatically.'),
        qaQ('What is the difference between the API and the worker?'),
        qaA('The API (index.js) handles HTTP requests from the frontend. It is always running. The worker (submissionWorker.js) is a separate process that listens to the job queue. In production, they run as separate Docker containers. This separation means the code execution cannot slow down or crash the main API server.'),

        // 3.6 JWT Auth
        gap(80),
        h2('3.6 JWT Authentication (Login System)'),
        txt('JWT stands for JSON Web Token. It is a way to prove "I am a logged-in user" without the server storing any session in memory.'),
        gap(40),
        codeBlock(
          'How login works in this project (auth.js):',
          '',
          '1. User sends: POST /api/auth/login  { email, password }',
          '2. Server checks password hash with bcrypt.compare()',
          '3. If correct, server creates a JWT:',
          '   jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: "7d" })',
          '4. JWT is returned to the frontend',
          '5. Frontend stores it in localStorage',
          '6. Every future request includes: Authorization: Bearer <token>',
          '7. The auth middleware decodes the token to get user info',
        ),
        qaQ('What is bcrypt and why are passwords hashed?'),
        qaA('bcrypt is a library that converts a password into a fixed-length scrambled string (hash) that cannot be reversed. We never store the actual password in the database — only the hash. When a user logs in, we hash what they typed and compare it to the stored hash. If they match, the password is correct. This way, even if the database is stolen, attackers cannot know the users\' passwords.'),
        qaQ('What is the difference between authentication and authorization?'),
        qaA('Authentication = proving who you are (login with email+password, get a token). Authorization = checking what you are allowed to do (FREE users cannot access premium content, only ADMIN can create problems). In this project, the auth middleware handles authentication (verifying the token). The requireEnrolled and requireAdmin middleware handle authorization (checking the role).'),
        qaQ('What are the 3 user roles in this project and what can each do?'),
        qaA('FREE = default role, can see problems and submit code but cannot access premium hints or editorials. ENROLLED = paid/enrolled user who can access all hints and editorial content. ADMIN = can create, edit, delete problems, view all submissions, and manage users. The role is stored inside the JWT so every request carries this information.'),
        tip('Interviewers love asking about role-based access control (RBAC). Know that the role is checked server-side in middleware, not just on the frontend. If the frontend hides a button, but someone sends the request directly, the server must still reject it.'),

        // 3.7 Code Execution
        gap(80),
        h2('3.7 Custom Code Execution Engine'),
        txt('This is the most unique part of the project. Instead of using a third-party API, the project compiles and runs code directly on the server using Node.js\'s spawn() function. Here is what happens for a C++ submission:'),
        numbered('Write the full code (user code + harness wrapper) to a temp .cpp file.'),
        numbered('Spawn a process: g++ -std=c++17 -O2 main.cpp -o main (compile step).'),
        numbered('If compilation fails, return Compilation Error.'),
        numbered('Spawn the compiled binary: ./main with stdin = test case input.'),
        numbered('If it runs longer than 3 seconds: return Time Limit Exceeded.'),
        numbered('Compare stdout output with expected output.'),
        numbered('Clean up the temp folder.'),
        gap(40),
        codeBlock(
          'Supported languages and how they run:',
          '  C++        → g++ compile → ./main',
          '  Java       → javac compile → java Main',
          '  Python     → python3 main.py (interpreted, no compile)',
          '  JavaScript → node main.js (interpreted, no compile)',
        ),
        gap(40),
        h3('What is a Code Harness?'),
        txt('Users write only the solution function (like in LeetCode). But to run code, you need a main() function that reads input and calls the solution. The harness is the wrapper code that is automatically added around user code before execution.'),
        gap(40),
        codeBlock(
          'Example (C++ two-sum problem):',
          '  // User writes only:',
          '  class Solution {',
          '    vector<int> twoSum(vector<int>& nums, int target) { ... }',
          '  };',
          '',
          '  // Harness adds:',
          '  int main() {',
          '    // reads input, calls solution, prints output',
          '  }',
        ),
        qaQ('What is a security risk with running user code on your server?'),
        qaA('This is the biggest weakness of this project! Running user code directly on the server is dangerous. A user could submit code that deletes files, makes network requests, or runs an infinite loop consuming all CPU and memory. Production judges like LeetCode use sandboxed containers (like Docker with seccomp filters) that restrict what the code can access. In this project, there is a 3-second timeout for safety, but proper isolation (sandbox) is not fully implemented. This is a great honest answer for an interviewer — shows you understand the limitation.'),
        qaQ('What is the difference between compile-time and runtime errors?'),
        qaA('Compile error = the code has syntax mistakes and cannot even be translated to machine code (e.g., missing semicolon in C++). Runtime error = the code compiles fine but crashes when running (e.g., array out of bounds, null pointer, division by zero). The project handles both: status ID 6 = compilation error, status ID 11 = runtime error.'),

        // 3.8 Complexity Analysis
        gap(80),
        h2('3.8 Complexity Analysis (The Cool Feature)'),
        txt('This is one of the most impressive features. The project estimates the time complexity (Big-O notation) of the user\'s code by measuring how execution time grows as input size grows.'),
        gap(40),
        codeBlock(
          'How it works (complexity.js):',
          '  1. Each problem has "ScalingInputs" in the database.',
          '     These are inputs of different sizes: n=100, n=1000, n=10000',
          '',
          '  2. After all test cases pass, the worker runs the code on these',
          '     scaling inputs and records execution times:',
          '     n=100   → 0.5ms',
          '     n=1000  → 5ms',
          '     n=10000 → 50ms',
          '',
          '  3. It looks at how time grows as n grows.',
          '     If time × 10 when n × 10 → O(N)',
          '     If time × 100 when n × 10 → O(N²)',
          '',
          '  4. The verdict includes: "Your solution is O(N log N)"',
        ),
        qaQ('What is Big-O notation?'),
        qaA('Big-O notation describes how an algorithm\'s performance grows as the input size (n) grows. O(1) = constant time, same speed no matter how big the input. O(N) = linear, time grows proportionally with input. O(N log N) = slightly worse than linear. O(N²) = quadratic, slows down rapidly for large inputs. Example: if sorting 10 numbers takes 1ms and sorting 100 numbers takes 100ms, that is O(N²) (10x input = 100x time). If it takes 10ms, that is O(N) (10x input = 10x time).'),
        qaQ('Why does the complexity analysis subtract a "baseline" from timing measurements?'),
        qaA('Because spawning a process (like running g++) has a fixed startup overhead of maybe 100ms regardless of what the code does. This startup time makes small inputs look slower than they are, which distorts the growth ratio. By subtracting the minimum measured time (the baseline), we get a cleaner picture of the algorithmic growth.'),

        // 3.9 TypeScript
        gap(80),
        h2('3.9 TypeScript'),
        txt('TypeScript is JavaScript with added types. A type is a label that says "this variable is a number" or "this function returns a string". Without types, you can pass any value anywhere and only discover mistakes when the code runs. With TypeScript, mistakes are caught while you are writing the code.'),
        codeBlock(
          '// JavaScript (no types):',
          '  function add(a, b) { return a + b; }',
          '  add("hello", 5) // No error until runtime, gives "hello5"',
          '',
          '// TypeScript (with types):',
          '  function add(a: number, b: number): number { return a + b; }',
          '  add("hello", 5) // Error caught immediately: "hello" is not a number',
        ),
        txt('The frontend of this project is in TypeScript (.tsx files). The backend is in plain JavaScript (.js files). TypeScript is especially useful in the frontend because it describes exactly what data comes from the API, preventing many bugs.'),
        qaQ('Why use TypeScript instead of JavaScript?'),
        qaA('TypeScript catches bugs at compile time (before running). In a big project, it is easy to make mistakes like accessing a property that does not exist, or passing the wrong type to a function. TypeScript makes the code self-documenting — you can see exactly what each function expects and returns. It also makes refactoring safer: if you rename a function, TypeScript shows all the places you need to update.'),

        // 3.10 Docker
        gap(80),
        h2('3.10 Docker (Containerization)'),
        txt('Docker packages your application and all its dependencies into a "container" — a lightweight, self-contained box that runs the same way everywhere. Instead of saying "I need Node.js 20, PostgreSQL 16, Redis 7, and g++ installed on the server", you say "here is a Docker image that has everything".'),
        gap(40),
        codeBlock(
          'From docker-compose.yml:',
          '  services:',
          '    backend:  (runs the API server)',
          '    worker:   (runs the submission worker)',
          '    frontend: (runs the Next.js app)',
          '',
          '  All three run in separate containers.',
          '  They communicate over a shared internal network.',
        ),
        qaQ('What is the difference between a Docker image and a container?'),
        qaA('An image is like a recipe or blueprint — a static file with instructions to build the environment. A container is a running instance of that image — like the actual meal made from the recipe. You can run multiple containers from the same image. In this project, the backend and worker use the same image (same Dockerfile) but start different commands.'),
        qaQ('Why are the API and worker in separate containers?'),
        qaA('Separation of concerns. If the worker crashes (because some code causes a catastrophic error), the API keeps running. If you need to scale (handle more submissions), you can add more worker containers without touching the API. Also, the worker needs g++, javac, and python installed. By separating it, only the worker container needs those tools.'),

        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 4 — PROJECT-SPECIFIC INTERVIEW Q&A
        // ═══════════════════════════════════════════════
        h1('4. Interview Questions — From Your Own Project'),
        txt('These are questions an interviewer will almost certainly ask if you mention this project. Prepare these cold.'),

        h2('4.1 Architecture & System Design'),
        qaQ('Walk me through the architecture of your project.'),
        qaA('The project has a Next.js frontend, an Express.js backend API, and a separate worker process. When a user submits code, the API creates a database record and enqueues a job in BullMQ (backed by Redis). The worker picks up the job, compiles and runs the code against test cases, stores the result in Redis, and updates the database. The frontend polls the result endpoint every 2 seconds until the verdict arrives. For data storage, PostgreSQL (via Prisma ORM) is the main database, and Redis is used as a cache and queue backend.'),

        qaQ('Why did you separate the worker from the API?'),
        qaA('Three reasons: First, code execution can take several seconds — if it blocked the API, other users\' requests would be delayed. Second, if the worker crashes while running unsafe user code, the API server stays up. Third, they can scale independently — you can add more worker instances to handle submission load without scaling the API.'),

        qaQ('What happens if the worker crashes in the middle of a submission?'),
        qaA('BullMQ handles this. Jobs are stored in Redis even while being processed. If the worker crashes, the job is marked as failed. Since submissions are configured with "attempts: 2", BullMQ will retry the job. The submission status in the database would remain "RUNNING" until the retry completes or all retries are exhausted. A production improvement would be to add a monitor that checks for stuck-in-RUNNING submissions and resets them.'),

        qaQ('How does the frontend know when the verdict is ready?'),
        qaA('It polls. After submitting, the frontend stores the submission ID and calls GET /api/submissions/:id every 2 seconds. The server checks Redis first (fast), then falls back to the database. When the verdict changes from PENDING/RUNNING to something like ACCEPTED or WRONG_ANSWER, the frontend stops polling and shows the result. An alternative approach (which would be more efficient) is WebSockets or Server-Sent Events, where the server pushes the result to the frontend instead of the frontend asking repeatedly.'),

        h2('4.2 Security Questions'),
        qaQ('What security measures did you implement?'),
        qaA('Four main ones. First, passwords are hashed with bcrypt before storing — so the database never contains plain passwords. Second, JWT tokens authenticate every API request — the auth middleware verifies the token on every protected route. Third, role-based access control prevents FREE users from accessing premium content, and non-admins from touching admin routes. Fourth, database queries use Prisma which protects against SQL injection — user input is parameterized, never concatenated directly into SQL strings.'),

        qaQ('What is SQL injection? How does Prisma protect against it?'),
        qaA('SQL injection is when an attacker types SQL code into an input field, hoping it gets executed by the database. For example, if code is: "SELECT * FROM users WHERE email = \'" + email + "\'", an attacker can type: \' OR 1=1 -- and the query becomes "SELECT * FROM users WHERE email = \'\' OR 1=1" which returns all users. Prisma uses parameterized queries internally — it never concatenates user input directly into SQL. Instead, the database treats the input as a literal value, not as code. So the injection attempt is treated as a string, not as SQL.'),

        qaQ('What is a bigger security problem in this project?'),
        qaA('Running user-submitted code on the server without proper sandboxing. A user could submit code that reads environment variables (stealing the database URL or JWT secret), makes HTTP calls to external services, or consumes all CPU/memory. A production fix would be to use Docker with resource limits and seccomp profiles for each execution, or use a dedicated sandboxed execution service. This is an honest weakness and shows technical maturity to mention it.'),

        h2('4.3 Database Questions'),
        qaQ('How are problems related to test cases in your database?'),
        qaA('Each Problem has an ID. Each TestCase has a problemId field that references the Problem\'s ID. This is a one-to-many relationship: one problem can have many test cases, but each test case belongs to exactly one problem. Prisma makes this easy — when you query a problem with "include: { testCases: true }", it automatically joins and returns all test cases in one query.'),

        qaQ('What is the difference between the Submission table and the UserProgress table?'),
        qaA('Submission records every single attempt — every time a user clicks Submit, a new row is added. A user can have dozens of submissions for one problem. UserProgress records the highest status per user-problem pair: SOLVED, ATTEMPTED, or REVISIT. It has a unique constraint on (userId, problemId), so there is only one progress record per user per problem. The worker updates both after each submission.'),

        qaQ('What are ScalingInputs and why are they in the database?'),
        qaA('ScalingInputs are pre-defined inputs of different sizes (n=100, n=1000, n=10000, etc.) for each problem. They are used to measure how the execution time grows, which is then used to estimate the user\'s time complexity. They are stored in the database so that each problem can have custom scaling inputs appropriate for that problem\'s data size.'),

        h2('4.4 Feature Questions'),
        qaQ('How does the AI hint feature work?'),
        qaA('The frontend sends the problem slug, the user\'s current code, and the language to POST /api/ai/hint. The backend fetches the problem details from the database and calls an external AI service (an LLM API) with a prompt containing the problem description, constraints, difficulty, and the user\'s code. The AI generates a hint that helps without giving away the solution. The result is hashed and cached in Redis so the same code+problem combination returns an instant response on the second request.'),

        qaQ('How does the streak system work?'),
        qaA('The Streak table stores currentStreak, longestStreak, and lastSolvedAt for each user. In the worker, after a successful ACCEPTED verdict, it checks if the user has already solved that problem. If not, it updates the streak. It calculates the gap in days between today and lastSolvedAt. If gap = 0 (solved again today), streak stays the same. If gap = 1 (solved yesterday and today), streak increases by 1. If gap > 1 (missed a day), streak resets to 1. The longestStreak is always updated to be the max of current and previous longest.'),

        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 5 — OUTSIDE-PROJECT INTERVIEW Q&A
        // ═══════════════════════════════════════════════
        h1('5. Interview Questions — General Tech Concepts'),
        txt('Interviewers will not only ask about your project. They will ask general questions about the technologies and concepts you used. These are the most important ones.'),

        h2('5.1 Web & API Concepts'),
        qaQ('What is the difference between GET, POST, PUT, and DELETE?'),
        qaA('GET = fetch data, nothing changes on the server (used to get problem list, get submission status). POST = send data to create something new (login, register, submit code). PUT/PATCH = update an existing resource (admin editing a problem). DELETE = remove a resource. GET requests can be bookmarked and cached. POST/PUT/DELETE change server state and should not be cached. These are called HTTP methods or HTTP verbs.'),

        qaQ('What is CORS and why did you enable it in the backend?'),
        qaA('CORS (Cross-Origin Resource Sharing) is a browser security rule. By default, a webpage at https://dsa-judge.vercel.app cannot make HTTP requests to https://dsa-judge-api.onrender.com because they are on different origins (different domains). The backend enables CORS by adding headers to its responses that say "I allow requests from the frontend". Without CORS enabled, the browser blocks the request and the frontend shows a "CORS error". In development, this matters when the frontend runs on localhost:3000 and the backend on localhost:5000.'),

        qaQ('What is the difference between localStorage and a cookie for storing a token?'),
        qaA('localStorage is JavaScript storage in the browser — only accessible via JavaScript. It persists after closing the browser. Cookies can be set as httpOnly, which means JavaScript cannot access them — this makes them safer against XSS attacks (where malicious JavaScript runs on your page and steals the token). This project stores the JWT in localStorage (simpler to implement), but the more secure approach for production would be httpOnly cookies. It is a valid tradeoff to mention in an interview.'),

        qaQ('What is HTTPS and why does it matter?'),
        qaA('HTTP = data sent as plain text. Anyone between the user and server can read it (like a postcard). HTTPS = data encrypted using TLS/SSL (like a sealed envelope). HTTPS ensures that when you submit a password or JWT token, it cannot be intercepted. Both Vercel (frontend) and Render (backend) provide HTTPS automatically for deployed apps. Always tell interviewers that production apps must use HTTPS.'),

        h2('5.2 Database Concepts'),
        qaQ('What is the difference between SQL and NoSQL databases?'),
        qaA('SQL (relational) databases like PostgreSQL store data in structured tables with fixed schemas and use SQL to query. Data is normalized — related data is split into multiple tables and joined when needed. NoSQL databases like MongoDB store data as flexible documents (like JSON). SQL is better for structured data with clear relationships (like users, problems, submissions). NoSQL is better for unstructured data or when flexibility is more important. For this project, SQL was the right choice because the relationships between tables are clear and important.'),

        qaQ('What is database indexing? Where would you add an index in this project?'),
        qaA('An index is like a book\'s index — instead of scanning every page to find a word, you jump directly to the right page. In a database, an index on a column lets the database find rows faster. Without an index on email in the User table, finding a user by email requires scanning every row (slow for millions of users). Prisma automatically creates indexes for @unique and @id fields. In this project, you could add an index on Submission.userId (to quickly fetch all submissions by a user) and Submission.problemId (for admin views).'),

        qaQ('What is a transaction? When would you use one here?'),
        qaA('A transaction is a group of database operations that either all succeed or all fail together. Example: when the worker finishes a submission, it needs to update the Submission table AND update the UserProgress table AND update the Streak table. If the server crashes between steps, some records would be updated and some would not — the data is inconsistent. Wrapping all three in a transaction ensures they either all succeed or all roll back. This project currently does these as separate operations (without a transaction), which is a real improvement opportunity.'),

        h2('5.3 Node.js & JavaScript Concepts'),
        qaQ('What is the event loop in Node.js?'),
        qaA('Node.js runs on a single thread (unlike Java which can run many threads at once). The event loop is how Node.js handles many tasks "at the same time" without actually running them simultaneously. When Node.js starts a slow operation (like reading a file or making a database call), it does not wait — it moves on to the next task, and when the slow operation finishes, it comes back to handle it. This is called non-blocking I/O. It is why Node.js is fast for web servers (which spend most time waiting for database or network), but bad for CPU-heavy work (like compiling C++ code — which is why that is done in a separate worker process).'),

        qaQ('What is the difference between a callback, a Promise, and async/await?'),
        qaA('All three are ways to handle asynchronous code (code that does not finish immediately). Callbacks: you pass a function that runs when the task finishes — can lead to "callback hell" with many nested functions. Promises: an object that represents a future value — cleaner with .then() and .catch(). Async/await: syntactic sugar over Promises — you write asynchronous code that looks synchronous, with try/catch for errors. This project uses async/await everywhere (e.g., const problem = await prisma.problem.findUnique(...)). Async/await makes code much easier to read.'),

        qaQ('What does "await" actually do?'),
        qaA('await pauses the execution of the current function until the Promise resolves. It does NOT block the entire Node.js server — other requests can still be handled while waiting. Think of it like: you call a waiter (make a database call), and await means "I\'ll wait here for the food, but other tables can still be served". Without await, the code would continue before the database responds, and you would get undefined instead of data.'),

        h2('5.4 System Design Concepts'),
        qaQ('How would you scale this project to handle 10,000 concurrent users?'),
        qaA('Several strategies: First, run multiple worker instances so more submissions can be processed simultaneously. Second, add a load balancer in front of multiple API instances. Third, add database read replicas for read-heavy operations (fetching problems). Fourth, use a CDN (Content Delivery Network) to serve static frontend files faster globally. Fifth, add connection pooling (PgBouncer) for the database so thousands of connections are managed efficiently. Sixth, increase Redis memory so more results can be cached. The queue system already makes the architecture horizontally scalable for submissions.'),

        qaQ('What is horizontal scaling vs vertical scaling?'),
        qaA('Vertical scaling = making one machine bigger (more CPU, more RAM). Simple but has a limit — there is only so big a single machine can get. Horizontal scaling = adding more machines. More complex (need load balancer, shared state) but theoretically unlimited. For this project, the stateless API (no session stored in memory, JWT is verified from the token itself) allows horizontal scaling easily — any API instance can handle any request.'),

        qaQ('What are WebSockets and when would you use them instead of polling?'),
        qaA('WebSockets create a persistent, two-way connection between client and server. With polling (current approach), the frontend asks "is it done?" every 2 seconds, causing many unnecessary requests. With WebSockets, the server pushes "it\'s done!" to the frontend the moment the result is ready — no wasted requests, and results arrive faster. WebSockets would be better for this project, but polling is simpler to implement and good enough for moderate traffic. The tradeoff is development complexity vs efficiency.'),

        h2('5.5 Deployment & DevOps'),
        qaQ('How is the project deployed?'),
        qaA('Frontend is deployed on Vercel — a platform specialized for Next.js that handles builds, CDN distribution, and HTTPS automatically. Backend (API + worker) is deployed on Render — a cloud platform where Docker containers can be hosted. There is also a render.yaml configuration file that describes the backend services as code (Infrastructure as Code). The frontend talks to the backend via the NEXT_PUBLIC_API_URL environment variable.'),

        qaQ('What is an environment variable and why are they important?'),
        qaA('Environment variables are configuration values passed to the program from outside the code. Examples: DATABASE_URL (database connection string), JWT_SECRET (secret key for signing tokens), REDIS_URL (Redis connection). They are never put inside code files or committed to Git because they contain secrets. Each environment (local, staging, production) has different values. Accidentally committing a secret to GitHub is a common security mistake — the .gitignore file is used to exclude .env files.'),

        pageBreak(),

        // ═══════════════════════════════════════════════
        //  SECTION 6 — THINGS TO STUDY FURTHER
        // ═══════════════════════════════════════════════
        h1('6. What to Study Further (After Understanding This Project)'),
        txt('This project touches many real-world engineering concepts. Here are the gaps to close, ordered by interview frequency:'),
        gap(40),
        infoTable([
          ['Topic', 'Why It Matters for Interviews', true],
          ['SQL Joins', 'Understanding JOIN, LEFT JOIN, GROUP BY, COUNT — very common in interviews'],
          ['Database transactions', 'ACID properties, atomicity — came up as a gap in this project'],
          ['WebSockets vs polling', 'Better pattern for real-time updates — mentioned as an improvement'],
          ['Container sandboxing', 'seccomp, cgroups, Docker security — the code execution weakness'],
          ['Rate limiting', 'Prevent spam submissions — not implemented, common interview question'],
          ['OAuth / SSO', 'Third-party login (Google, GitHub) — how real apps handle auth'],
          ['Microservices', 'This project is almost there — knowing the theory helps explain it'],
          ['Load balancing', 'How traffic is distributed across multiple servers'],
          ['CDN', 'How static files are served globally at low latency'],
          ['Database indexing', 'When and how to add indexes — query optimization'],
          ['Message queues', 'Kafka vs RabbitMQ vs BullMQ — differences and use cases'],
          ['Caching strategies', 'Cache-aside vs write-through, cache invalidation strategies'],
          ['System design', 'Design a URL shortener, design Twitter, design a code judge'],
          ['Network basics', 'TCP/IP, DNS, HTTP/2, TLS handshake — understand how data travels'],
        ]),

        gap(80),
        h2('6.1 Honest Things to Say in an Interview'),
        txt('Interviewers respect honesty and self-awareness. Here are things you can say about this project that show maturity:'),
        featureCard('✅', 'On code execution security', '"I know that running untrusted code directly on the server is a risk. In production, I would use Docker containers with seccomp profiles and resource limits, or a dedicated sandboxing service."'),
        featureCard('✅', 'On database transactions', '"The worker currently updates Submission, UserProgress, and Streak as separate operations. Wrapping them in a transaction would ensure data consistency if the server crashes mid-update."'),
        featureCard('✅', 'On polling', '"The frontend polls for results every 2 seconds. A better approach would be WebSockets or Server-Sent Events so the server pushes results instantly, reducing unnecessary requests."'),
        featureCard('✅', 'On AI assistance', '"I built this project with AI assistance. The AI helped me understand the patterns, write boilerplate, and debug. But I understand every part of how the system works and why each decision was made."'),
        featureCard('✅', 'On rate limiting', '"The API does not currently have rate limiting. A user could spam 1000 submissions per minute, consuming all server resources. In production, I would use middleware like express-rate-limit."'),

        gap(80),
        h2('6.2 Key Terms Cheat Sheet'),
        infoTable([
          ['Term', 'Simple Meaning', true],
          ['REST API', 'A standard way for frontend and backend to communicate using HTTP'],
          ['JWT', 'A signed token that proves who you are, without server storing sessions'],
          ['ORM', 'Library that lets you interact with a database using your programming language'],
          ['Queue / Worker', 'Task system: API adds tasks, worker processes them in background'],
          ['Cache', 'Fast temporary storage to avoid hitting the slow database repeatedly'],
          ['TTL', 'Time To Live — how long something stays in cache before auto-deleting'],
          ['Async/Await', 'Way to handle operations that take time, without blocking other work'],
          ['Middleware', 'Code that runs before a route handler — for auth, logging, validation'],
          ['Slug', 'URL-friendly version of a name: "Two Sum" → "two-sum"'],
          ['Hash', 'One-way scrambling of data — passwords are stored as hashes'],
          ['RBAC', 'Role-Based Access Control — different roles have different permissions'],
          ['Polling', 'Repeatedly asking for an update until it arrives'],
          ['Spawn', 'Creating a new process (e.g., g++) from within Node.js'],
          ['Big-O', 'How an algorithm\'s time grows as input size grows'],
          ['Docker', 'Packaging app + dependencies into a portable container'],
          ['Prisma', 'ORM for Node.js that translates JS code into database queries'],
          ['BullMQ', 'Job queue library built on Redis for background task processing'],
          ['Monaco', 'VS Code\'s editor, available as a library to embed in web apps'],
          ['App Router', 'Next.js routing system where file structure = URL structure'],
        ]),

        pageBreak(),

        // ═══════════════════════════════════════════════
        //  FINAL SECTION — HOW TO PRESENT THE PROJECT
        // ═══════════════════════════════════════════════
        h1('7. How to Present This Project in an Interview'),
        txt('The interviewer will typically say: "Tell me about a project you have built." Here is a template answer — practice this out loud until it feels natural:'),
        gap(40),
        new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
          border: { left: { style: BorderStyle.SINGLE, size: 16, color: C.green } },
          indent: { left: 240, right: 240 },
          children: [
            new TextRun({ text: '"I built DSA Judge — a full-stack online coding judge platform similar to LeetCode. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'The frontend is Next.js with a Monaco editor so users can write and submit code in the browser. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'The backend is Express.js with PostgreSQL as the main database using Prisma as the ORM. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'The most interesting technical challenge was making code execution async — when a user submits code, instead of blocking the HTTP request, I enqueue a job using BullMQ backed by Redis, and a separate worker process compiles and runs the code. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'The frontend polls for the result until the verdict is available. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'I also built a complexity estimator that runs the code on inputs of different sizes and estimates the Big-O complexity. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'Authentication uses JWT with role-based access control — FREE, ENROLLED, and ADMIN roles. ', size: 22, font: 'Arial', color: C.text }),
            new TextRun({ text: 'The biggest known weakness is code execution sandboxing — I use timeouts but not full container isolation, which I would fix in production."', size: 22, font: 'Arial', color: C.dark, bold: true }),
          ],
        }),
        gap(80),
        warn('Never say "the AI built it for me." Say "I built it with AI assistance" — which is true and increasingly normal. The important thing is that you understand it, which this report will help you do.'),
        gap(120),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: '🎯', size: 48, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: 'You built something real.', bold: true, size: 32, color: C.purple, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: 'Now you understand every part of it. That is what matters in an interview.', italics: true, size: 24, color: C.muted, font: 'Arial' })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('./DSA_Judge_Interview_Report.docx', buffer);
  console.log('✅ Report written!');
}).catch(console.error);