# Scripts UI CLI

Command-line interface for Scripts UI.

## Installation

The CLI is automatically installed when you install the Scripts UI package:

```bash
npm install -g script-ui
```

Or you can run it directly from the project:

```bash
npm run cli
```

## Commands

### serve

Start the Scripts UI server.

```bash
scripts-ui serve [options]
```

#### Options

- `--dotenv <path>`: Path to a custom .env file to load environment variables from

#### Examples

Start the server with default environment:

```bash
scripts-ui serve
```

Start the server with a custom environment file:

```bash
scripts-ui serve --dotenv .env.production
```

## Development

To run the CLI during development:

```bash
node cli/index.js serve
```
