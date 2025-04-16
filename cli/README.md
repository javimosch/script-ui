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

## Usage Collection

On first run, the CLI will ask for consent to collect anonymous usage data:

```
🔍 Usage Collection Consent
---------------------------
Scripts UI would like to collect anonymous usage data to improve the application.
This includes only script execution exit codes and error flags - no personal data or script content.
Would you like to enable anonymous usage collection? (y/n):
```

This data helps improve the application by understanding common issues. The collected data includes only:
- Script execution exit codes
- Error flags (true/false)

No personal data or script content is collected.

Your preference is stored in `~/.scriptsui/state.json` and can be changed by editing this file.

## Development

To run the CLI during development:

```bash
node cli/index.js serve
```
