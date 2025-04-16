# Script UI Knowledge Base

## Project Overview
Web-based UI for managing and executing scripts across multiple languages (JavaScript, TypeScript, Shell).

## Key Features
- Multi-language script execution (Node.js, Deno, Bash)
- Command-line arguments support for all script types
- Multiple script sources management
- Drag-and-drop file upload
- Environment variable configuration
- Deno permission management
- WebSocket-based script output streaming

## Architecture
- Frontend: Vue 3 with ESM imports
- Backend: Express.js with WebSocket support
- Storage: File system for scripts, localStorage for configurations

## Important Directories
- `/frontend`: Vue.js frontend application
- `/backend`: Express.js server
- `/scripts`: Default script storage location
- `/data`: Configuration storage (sources.json)

## Environment Variables
- `PORT`: Server port (default: 3000)
- `SCRIPTS_DIR`: Custom scripts directory location

## Script Execution
- Node.js (.js): Direct execution with environment variables and command-line arguments
- Deno (.ts): Uses --env flag for environment variables, supports command-line arguments
- Shell (.sh): Executed with bash, supports command-line arguments

## Security Notes
- Default source cannot be modified or deleted
- Script file size limited to 1MB
- Only .js, .ts, and .sh files are allowed
- Shell scripts are automatically made executable
- Command-line arguments are passed directly to scripts