# Frontend Knowledge Base

## Technology Stack
- Vue 3 (ESM build)
- TailwindCSS + DaisyUI
- WebSocket for real-time script output

## Component Structure
- `App.js`: Root component with navigation
- `ScriptList.js`: Script management and upload
- `ScriptOutput.js`: Real-time script execution output
- `Sources.js`: Script source management
- `Config.js`: Environment and permission configuration

## Configuration
- Uses localStorage for persistent configuration
- Key: 'script-ui-config'
- Stores:
  - Global environment variables
  - Per-script configurations
  - Deno permissions

## Important Notes
- All Vue components use ESM imports
- All components must import from unpkg.com/vue@3/dist/vue.esm-browser.js
- File upload accepts only .js, .ts, and .sh files
- Environment variables are managed at both global and script level
- Script-specific settings override global ones

## Styling
- Uses Tailwind utility classes
- DaisyUI components for enhanced UI elements
- Consistent button styling with btn-primary class
- Responsive grid layout for script management

## WebSocket Usage
- Connect to ws://localhost:3000/ws
- Message format: { type: 'run', script: string, config: object }
- Receives: { type: 'output'|'error'|'exit', data: string }