---
phase: 01-login-demo-ui-and-validation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - index.html
  - styles.css
  - app.js
autonomous: false
requirements:
  - F-01
  - F-02
  - F-03
  - F-04
  - F-05
  - NF-01
  - NF-02
  - NF-03
  - NF-04
user_setup: []
must_haves:
  truths:
    - User can open `index.html` in a browser and see a username field, a password field, and a submit button.
    - Submitting with either field empty shows a clear visual error.
    - Submitting credentials other than `admin` / `123456` shows a clear visual/accessibility-friendly error.
    - Submitting `admin` / `123456` shows a success state/message.
    - The layout is usable and visually clean on both mobile and desktop without external frameworks.
  artifacts:
    - path: index.html
      provides: Semantic login form structure
      contains: "<form", "input", "type=\"password\"", "type=\"submit\""
    - path: styles.css
      provides: Mobile-first responsive styling and state visuals
      contains: "@media", ".error", ".success"
    - path: app.js
      provides: Client validation, demo credential check, and state rendering
      contains: "addEventListener('submit'", "trim()", "admin", "123456"
  key_links:
    - from: index.html
      to: styles.css
      via: <link rel="stylesheet">
      pattern: "<link.*styles\\.css"
    - from: index.html
      to: app.js
      via: <script src>
      pattern: "<script.*app\\.js"
    - from: app.js
      to: index.html form
      via: querySelector / getElementById
      pattern: "querySelector\\('#login-form'\\)|getElementById\\('login-form'\\)"
    - from: app.js
      to: styles.css state classes
      via: classList.add
      pattern: "classList\\.add\\(['\"]error|classList\\.add\\(['\"]success"
---

<objective>
Build the complete vanilla login demo: a responsive, dependency-free login form with client-side validation, demo credential verification, and clear error/success feedback.

Purpose: Deliver the first shippable version of Login Simple so users can immediately interact with a clean, accessible login screen.
Output: `index.html`, `styles.css`, and `app.js` wired together and verified.
</objective>

<execution_context>
@C:/Users/USUARIO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/USUARIO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/PROJECT.md
@.planning/STATE.md

## Key Constraints

- **No external frameworks or libraries**: Use only HTML5, CSS3, and vanilla JavaScript (ES6+).
- **Demo credentials**: `admin` / `123456`.
- **File split**: Logic, presentation, and structure must live in separate files (`app.js`, `styles.css`, `index.html`).
- **Accessibility**: Errors must be associated with fields and announced visually.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build responsive login form UI</name>
  <files>index.html, styles.css</files>
  <action>
    Create `index.html` with a semantic HTML5 document containing:
    - A centered login card with a heading (e.g., "Login").
    - A `<form id="login-form">` with:
      - A labeled text input for username (`id="username"`, `name="username"`, `required` is optional because JS will handle validation).
      - A labeled password input for password (`id="password"`, `name="password"`).
      - A submit button (`type="submit"`).
    - An empty container for inline messages (e.g., `<p id="message" role="status" aria-live="polite"></p>`).
    - Links to `styles.css` in `<head>` and `app.js` before closing `</body>`.

    Create `styles.css` with:
    - CSS reset/normalize (minimal, hand-rolled).
    - Mobile-first base styles: readable font stack, comfortable padding, full-width inputs/button on small screens.
    - A centered card layout using flexbox (min-height 100vh), with a max-width and padding.
    - Focus states for accessibility.
    - `.error` class: red-ish border/text, visible message styling.
    - `.success` class: green-ish styling, hides form or shows a success panel.
    - A media query (`@media (min-width: 480px)`) that widens the card and adjusts padding for desktop.

    Avoid any external CDN or framework references.
  </action>
  <verify>
    <automated>
      PowerShell:
      ```powershell
      Test-Path index.html, styles.css | ForEach-Object { $_ };
      Select-String -Path index.html -Pattern '<form\b', 'id="username"|name="username"', 'type="password"', 'type="submit"', '<link[^>]*styles\.css', '<script[^>]*app\.js';
      Select-String -Path styles.css -Pattern '@media\s*\(', '\.error\s*\{', '\.success\s*\{'
      ```
    </automated>
  </verify>
  <done>
    `index.html` exists and contains a form with username, password, and submit inputs linked to `styles.css` and `app.js`. `styles.css` exists and includes mobile-first layout, `@media`, `.error`, and `.success` rules.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement validation, demo credentials check, and state rendering</name>
  <files>app.js</files>
  <action>
    Create `app.js` that:
    1. Waits for DOM content loaded.
    2. Selects the form (`#login-form`), username (`#username`), password (`#password`), and message container (`#message`).
    3. Adds a `submit` event listener that calls `event.preventDefault()`.
    4. On submit:
       - Trims both field values.
       - Removes previous `error`/`success` classes and clears the message.
       - If either field is empty:
         - Add `.error` class to the empty field(s) and the message container.
         - Show an accessible error message (e.g., "Please fill in all fields.").
         - Focus the first empty field.
       - If both fields are non-empty:
         - Compare against demo credentials `admin` / `123456`.
         - On match: add `.success` class to the message container, hide or replace the form with a success message (e.g., "Welcome, admin!"), and optionally clear inputs.
         - On mismatch: add `.error` class to both fields and the message container, show an accessible error message (e.g., "Invalid username or password."), and focus the username field.
    5. Adds `input` listeners to clear the error class from a field while the user is typing.

    Keep functions small, use clear variable names, and avoid global namespace pollution.
  </action>
  <verify>
    <automated>
      PowerShell:
      ```powershell
      Test-Path app.js;
      Select-String -Path app.js -Pattern 'addEventListener\s*\(\s*[''"]submit', '\.trim\s*\(\s*\)', 'admin', '123456', 'preventDefault\s*\(\s*\)', 'classList\.add\s*\(\s*[''"]error', 'classList\.add\s*\(\s*[''"]success', 'focus\s*\(\s*\)'
      ```
    </automated>
  </verify>
  <done>
    `app.js` exists and prevents default submission, validates non-empty trimmed values, checks against `admin`/`123456`, and applies `.error` or `.success` classes with clear messages.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human-verify visual feedback and responsive layout</name>
  <files>index.html, styles.css, app.js</files>
  <action>
    Have a human open `index.html` in a browser and exercise the full login flow plus responsive layout checks. This task validates visual and interactive behavior that cannot be fully confirmed with static file analysis.
  </action>
  <what-built>Complete responsive login demo: HTML form, CSS styling, and JavaScript validation with demo credentials.</what-built>
  <how-to-verify>
    1. Open `index.html` in a browser (Chrome/Edge/Firefox).
    2. **Empty field error**: Click "Login" without typing. Confirm both fields highlight and an error message appears.
    3. **Wrong credentials error**: Type `admin` / `wrongpassword` and submit. Confirm an error message appears and fields are highlighted.
    4. **Success state**: Type `admin` / `123456` and submit. Confirm a success message appears (and/or the form is replaced).
    5. **Responsive layout**: Open browser DevTools, toggle device toolbar, and check widths 320px, 768px, and 1024px. Confirm the card remains readable, inputs are tappable, and no horizontal scroll appears.
    6. **Accessibility**: Tab through fields with keyboard; confirm focus rings are visible and error/success messages are readable.
  </how-to-verify>
  <verify>
    <automated>N/A — human verification required.</automated>
  </verify>
  <done>Human confirms all verification steps pass and types "approved".</done>
  <resume-signal>Type "approved" or list any issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- All three files (`index.html`, `styles.css`, `app.js`) exist in the project root.
- `index.html` links to both `styles.css` and `app.js`.
- `app.js` references `#login-form`, `#username`, `#password`, and demo credentials `admin` / `123456`.
- `styles.css` includes `@media`, `.error`, and `.success` rules.
- Manual browser verification confirms empty-field errors, wrong-credential errors, success state, and responsive layout.
</verification>

<success_criteria>
- [ ] `index.html` loads in a browser and displays a username field, password field, and submit button.
- [ ] Submitting empty fields shows a clear visual error.
- [ ] Submitting credentials other than `admin` / `123456` shows an accessible error.
- [ ] Submitting `admin` / `123456` shows a success state/message.
- [ ] Layout is clean and usable on mobile (320px+) and desktop (1024px+) without external dependencies.
- [ ] Requirements F-01 through F-05 and NF-01 through NF-04 are addressed.
</success_criteria>

<output>
After completion, create `.planning/phases/01-login-demo-ui-and-validation/01-01-SUMMARY.md` summarizing what was built and any deviations from the plan.
</output>
