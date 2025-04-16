# Frontend Knowledge Base

## Technology Stack
- Vue 3 (ESM build)
- TailwindCSS + DaisyUI
- WebSocket for real-time script output

## Component Structure
- `App.js`: Root component with navigation
- `ScriptList.js`: Script management, upload, and selection
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
  - Command-line arguments

## Script Execution
- Supports command-line arguments for all script types
- Arguments are passed directly to the script execution
- Environment variables can be configured globally or per-script
- Script-specific settings override global ones

## Important Notes
- All Vue components use ESM imports
- All components must import from unpkg.com/vue@3/dist/vue.esm-browser.js
- File upload accepts only .js, .ts, and .sh files
- Script selection emits 'script-selected' event

## Styling
- Uses Tailwind utility classes
- DaisyUI components for enhanced UI elements
- Consistent button styling with btn-primary class
- Responsive grid layout for script management

## WebSocket Usage
- Connect to ws://window.location.origin+'/ws
- Message format: { type: 'run', script: string, config: { args?: string, env?: object, denoFlags?: string } }
- Receives: { type: 'output'|'error'|'exit', data: string }