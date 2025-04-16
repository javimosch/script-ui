# Frontend & Backend Modularization Guidelines

---

## Purpose
Establish consistent coding and documentation practices for scalable full-stack development. Focus on modularization, maintainability, and client-only architecture, along with in-code documentation via `*.knowledge.md` files.

---

## Common Principles (Both Frontend & Backend)

- **Modular by Feature:** Organize code by business domain, not file type.
- **File Size Target:** Keep files between **300–500 LOC**. Split early when logic grows.
- **Explicit Imports/Exports:** Use ES modules (`import/export`) consistently.
- **Reusable Logic:** Isolate shared logic into `utils`, `services`, `composables` (frontend), or `lib` (backend).
- **Knowledge Files:** Add `*.knowledge.md` in major folders to explain intent and structure.

---

## Frontend: React (Next.js, Client-Side Only)

### Constraints

- **Client-side only:** No SSR, SSG, or API routes.
- **Avoid Server Logic:** No `getServerSideProps`, `getStaticProps`, or middleware.
- **'use client' Required:** All components must include `'use client'` if they use hooks/state.
- **Static-hosting ready:** Build as a pure SPA.

### Folder Structure

```
/app
  /dashboard
    page.tsx
    layout.tsx
    useDashboard.ts
    dashboardService.ts
    DashboardCard.tsx
  /components
    - Button.tsx
    - Modal.tsx
  /utils
    - formatDate.ts
  /services
    - apiService.ts
```

### Example Page Component

```tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchData } from '@/services/apiService'

export default function DashboardPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(setData)
  }, [])

  return <div className="p-4">{JSON.stringify(data)}</div>
}
```

---

## Frontend: Raw HTML + JS (Vue 3 CDN + Tailwind + DaisyUI)

### File Structure

```
/public
  /js
    /modules
      /components
        - App.js
        - Card.js
      /composables
        - useForm.js
      /services
        - apiService.js
      /utils
        - formatters.js
  index.html
```

### Example HTML Setup

```html
<!-- External Dependencies -->
<script src="https://unpkg.com/vue@3/dist/vue.esm-browser.js" type="module"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/daisyui@latest"></script>

<div id="app"></div>

<!-- Module Scripts - IMPORTANT: Always use type="module" -->
<script type="module" src="js/modules/components/App.js"></script>
<script type="module">
  // Import App component and Vue functions from the ESM build URL
  import App from './js/modules/components/App.js'
  import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

  // Configure Tailwind without require (browser-safe)
  tailwind.config = {
    theme: {
        extend: {}
    },
    daisyui: {
        themes: ["light", "dark"]
    }
  }

  const app = createApp(App)
  app.mount('#app')
</script>
```

### Module Example (App.js)

```javascript
// Always use ES modules syntax
// Import Vue functions directly from the ESM build URL
import { ref, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { apiService } from '../services/apiService.js'

export default {
  name: 'App',
  setup() {
    const data = ref(null)
    
    // Always use .js extension in imports
    const fetchData = async () => {
      data.value = await apiService.getData()
    }

    return {
      data,
      fetchData
    }
  }
}
```

---

## Backend (Node.js + Express)

### Folder Structure

```
/services
  - userService.js
  - authService.js
/controllers
  - userController.js
/models
  - userModel.js
/utils
  - validation.js
```

### Guidelines

- **Controller = thin**: Route parsing and validation only.
- **Service = logic**: DB access, business rules.
- **Model = schema**: MongoDB or DB layer only.
- **Utils = stateless**: Pure functions only.

---

## Knowledge Files (`*.knowledge.md`)

### Purpose

Document logic-heavy modules directly in the codebase using Markdown. One per domain/module.

### File Placement

Place next to the module it documents:

```
/auth
  - authService.ts
  - useAuth.ts
  - auth.knowledge.md
```

### Template

```markdown
# [Module/Feature Name]

## Purpose
Short explanation of the module's role in the app.

## Folder Structure
List or describe relevant files and submodules.

## Key Concepts
Explain any business logic, assumptions, or architectural patterns.

## Usage Examples
```js
// Example usage
```

## Related Modules
- `XService.ts`
- `useX.ts`

## Notes
- Design decisions or edge cases.
```

### When to Add

| Condition               | Add Knowledge File |
|------------------------|--------------------|
| Folder > 2 files       | Yes                |
| Module > 300 LOC       | Yes                |
| Pure UI/Styling        | Optional           |
| Services or Composables| Strongly Recommended |

---

## Naming Conventions

| Element       | Convention            | Example              |
|---------------|------------------------|-----------------------|
| Composable    | `useX`                | `useAuth.js`          |
| Service       | `xService`            | `authService.js`      |
| Utility       | `camelCase` function  | `formatDate()`        |
| Component     | PascalCase            | `UserCard.js`         |
| Knowledge     | `module.knowledge.md` | `auth.knowledge.md`   |

---

## Frontend Module Rules

1. **Always Use `type="module"`**
   - Every script tag that imports/exports must have `type="module"`
   - Required for ES modules to work in browsers

2. **File Extensions Required**
   - Always include `.js` in import paths
   - Browser ES modules require explicit extensions

3. **Import Vue from ESM URL**
   - When using Vue via CDN with ES modules, import functions directly from the `.esm-browser.js` file URL.
   - Example: `import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'`

4. **Import Order**
   - External CDN dependencies first
   - Local modules after
   - Component-specific imports last

5. **Module Exports**
   - One default export per file
   - Named exports for utilities/helpers
   - Export at declaration when possible

6. **Tailwind Configuration in Browser**
   - Avoid using `require()` in browser-side JavaScript.
   - Configure Tailwind directly using the `tailwind.config` object.
   - Use the `daisyui` property within `tailwind.config` to configure themes and other DaisyUI settings.

---
## Summary Table

| Layer        | Description                         | Max LOC/File | Notes                             |
|--------------|-------------------------------------|--------------|-----------------------------------|
| Component    | UI only                             | < 400 LOC    | Stateless if possible             |
| Composable   | Reusable reactive logic             | < 400 LOC    | Vue `setup()` or React hooks      |
| Service      | Data fetching, app logic            | < 500 LOC    | Use `fetch`, no side effects      |
| Utility      | Pure helper functions               | < 300 LOC    | No external state or context      |
| Knowledge    | Internal documentation              | Short & clear| In `*.knowledge.md`               |

---

## Final Notes

- Treat each feature/module as an isolated unit of responsibility.
- Make every module understandable by reading its `*.knowledge.md`.
- Scale by **clarity**, not complexity.
- Always use ES modules with `type="module"` for frontend code.
- Include file extensions in import paths.

---
