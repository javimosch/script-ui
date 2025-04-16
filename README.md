# Scripts UI

A web-based interface for managing and executing scripts across multiple programming languages.

## Features

- 🔄 Multi-language script execution (Node.js, Deno, Shell)
- 📝 Command-line arguments support
- 🌍 Environment variable configuration
- 📂 Multiple script sources management
- 🔒 Deno permission management
- 📡 Real-time script output via WebSocket
- 📤 Drag-and-drop file upload
- 💾 Persistent configuration with file system or MongoDB
- 🎨 Modern UI with Tailwind CSS and DaisyUI

## Prerequisites

- Node.js (v14 or higher)
- Deno (for TypeScript script execution)
- Bash (for shell script execution)
- MongoDB (optional, for database persistence)

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
# Server configuration
PORT=3000                    # Server port (default: 3000)
SCRIPTS_DIR=/path/to/scripts # Custom scripts directory (optional)

# MongoDB configuration (optional)
USE_MONGODB=false            # Set to 'true' to enable MongoDB persistence
MONGODB_URI=mongodb://username:password@hostname:port/scriptsui?authSource=admin
```

### MongoDB Configuration

To use MongoDB for configuration persistence:

1. Set `USE_MONGODB=true` in your `.env` file
2. Provide a valid MongoDB connection URI in `MONGODB_URI`
3. Restart the server

When MongoDB is enabled, all configuration data (script configs, environment variables, sources, etc.) will be stored in MongoDB instead of the file system. This provides better scalability and allows for deployment across multiple instances.

Existing data from `data/sources.json` and `data/config.json` will be automatically migrated to MongoDB on first startup with MongoDB enabled.

## Usage

### Using the CLI

Script UI includes a command-line interface for easier server management:

```bash
# Quick start with npx (no installation required)
npx scripts-ui serve

# Start the server with default environment
npm run cli serve

# Start the server with a custom environment file
npm run cli serve --dotenv .env.production
```

For more information about the CLI, see [CLI Documentation](./cli/README.md).

### Using npm scripts

Alternatively, you can start the server using npm:

```bash
npm start
```

After starting the server, open your browser and navigate to `http://localhost:3000`

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
/cli             # Command-line interface
  index.js       # CLI entry point
  README.md      # CLI documentation
/frontend
  /js
    /components  # Vue components
    /services    # Frontend services
  index.html     # Entry point
/data            # Configuration storage
/scripts         # Default scripts location
```

## CLI

Scripts UI includes a command-line interface (CLI) for easier server management and automation.

### Installation

The CLI is automatically installed when you install the Scripts UI package:

```bash
npm install -g script-ui
```

### Commands

#### serve

Start the Scripts UI server.

```bash
scripts-ui serve [options]
```

**Options:**

- `--dotenv <path>`: Path to a custom .env file to load environment variables from

**Examples:**

```bash
# Start with default environment
scripts-ui serve

# Start with a custom environment file
scripts-ui serve --dotenv .env.production
```

## Docker Deployment

Scripts UI can be easily deployed using Docker.

### Using Docker Run

```bash
docker run -d \
  --name scriptsui \
  -p 3000:3000 \
  -v scripts_data:/scripts \
  -v config_data:/app/data \
  -e PORT=3000 \
  -e SCRIPTS_DIR=/scripts \
  javimosch/scriptsui
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  scriptsui:
    image: javimosch/scriptsui
    ports:
      - "3000:3000"
    volumes:
      - scripts_data:/scripts
      - config_data:/app/data
    environment:
      - PORT=3000
      - SCRIPTS_DIR=/scripts
      # Uncomment to enable MongoDB persistence
      # - USE_MONGODB=true
      # - MONGODB_URI=mongodb://username:password@mongodb:27017/scriptsui?authSource=admin
    restart: unless-stopped
    env_file:
      - .env
volumes:
  scripts_data:
    name: scriptsui_scripts
  config_data:
    name: scriptsui_config
```

Then run:

```bash
docker-compose up -d
```

## Development

The project uses:
- Frontend: Vue 3 (ESM build) + Tailwind CSS + DaisyUI
- Backend: Express.js + WebSocket
- Storage: File system or MongoDB + localStorage

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license here]