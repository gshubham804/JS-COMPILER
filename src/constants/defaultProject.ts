import type { ProjectFiles } from '../types';

export const DEFAULT_FILES: ProjectFiles = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
    content="width=device-width,
    initial-scale=1.0" />
  <link rel="stylesheet"
    href="style.css" />
  <title>JSC</title>
</head>
<body>
  <div class="container">
    <h1 id="title">Build something amazing</h1>
    <p class="sub">Edit the code and see magic happen ✨</p>
    <button id="btn" type="button">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,

  'style.css': `body {
  font-family: 'Inter', sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
}

.container {
  text-align: center;
}

button#btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

button#btn:hover {
  background: #2563eb;
}

.sub {
  margin-top: 0.5rem;
  opacity: 0.9;
  font-size: 0.95rem;
}
`,

  'script.js': `const title = document.getElementById('title');

const btn = document.getElementById('btn');

btn.addEventListener('click', () => {
  title.textContent = 'Hello from JSC! 🚀';
});
`,
};
