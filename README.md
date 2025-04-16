# Script UI

A web-based interface for managing and executing scripts across multiple programming languages.

## Features

- 🔄 Multi-language script execution (Node.js, Deno, Shell)
- 📝 Command-line arguments support
- 🌍 Environment variable configuration
- 📂 Multiple script sources management
- 🔒 Deno permission management
- 📡 Real-time script output via WebSocket
- 📤 Drag-and-drop file upload
- 🎨 Modern UI with Tailwind CSS and DaisyUI

## Prerequisites

- Node.js (v14 or higher)
- Deno (for TypeScript script execution)
- Bash (for shell script execution)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd script-ui
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000                    # Server port (default: 3000)
SCRIPTS_DIR=/path/to/scripts # Custom scripts directory (optional)
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

### Managing Scripts

- Upload scripts via drag-and-drop or file picker
- Supported file types: `.js`, `.ts`, `.sh`
- Scripts can be organized in multiple sources
- Default source is protected from modifications

### Script Execution

Scripts can be executed with:
- Custom environment variables
- Command-line arguments
- Deno permissions (for TypeScript files)

### Script Sources

- Configure multiple script locations
- Each source can be a different directory
- Sources are managed through the UI
- Default source cannot be modified or deleted

## WebSocket API

### Client to Server

```json
{
  "type": "run",
  "script": "script_name",
  "config": {
    "args": "string",      // Optional command-line arguments
    "denoFlags": "string", // Optional Deno-specific flags
    "env": {              // Optional environment variables
      "KEY": "value"
    }
  }
}
```

### Server to Client

```json
{
  "type": "output|error|exit",
  "data": "string"
}
```

## Security Notes

- File size limit: 1MB
- Only `.js`, `.ts`, and `.sh` files are allowed
- Shell scripts are automatically made executable
- Default source is protected
- Command-line arguments are passed directly to scripts
- Environment variables are sanitized

## Project Structure

```
/backend
  /routes        # API endpoints
  /services      # Business logic
  server.js      # Express server setup
/frontend
  /js
    /components  # Vue components
    /services    # Frontend services
  index.html     # Entry point
/data            # Configuration storage
/scripts         # Default scripts location
```

## Development

The project uses:
- Frontend: Vue 3 (ESM build) + Tailwind CSS + DaisyUI
- Backend: Express.js + WebSocket
- Storage: File system + localStorage

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license here]