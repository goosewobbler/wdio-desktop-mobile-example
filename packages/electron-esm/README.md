# @wdio-desktop-mobile-example/electron-esm

Electron test application (ESM) for WebdriverIO testing.

## Overview

This package provides a modern Electron application using ES modules for testing with `@wdio/electron-service`.

## Prerequisites

- Node.js 18+

## Installation

```bash
pnpm install
```

## Development

```bash
# Build the app
pnpm build

# Run tests
pnpm test

# Run CI (build + test)
pnpm ci
```

## Project Structure

```
.
├── src/
│   ├── main.js        # Main process (ESM)
│   ├── preload.js     # Preload script (ESM)
│   └── index.html     # Renderer HTML
├── test/              # WebdriverIO tests
│   ├── api.spec.ts
│   ├── application.spec.ts
│   ├── dom.spec.ts
│   └── interaction.spec.ts
├── wdio.conf.js       # WDIO configuration (ESM)
├── rollup.config.js   # Build configuration
└── package.json
```

## Features

- Window resize controls
- Dialog interactions
- Console logging
- IPC communication

## Differences from CJS Version

- Uses ES modules throughout
- Modern JavaScript syntax
- TypeScript support

## License

MIT
