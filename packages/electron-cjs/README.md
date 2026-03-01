# @wdio-desktop-mobile-example/electron-cjs

Electron test application (CommonJS) for WebdriverIO testing.

## Overview

This package provides a traditional Electron application using CommonJS modules for testing with `@wdio/electron-service`.

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
│   ├── main.js        # Main process (CJS)
│   ├── preload.js     # Preload script (CJS)
│   └── index.html     # Renderer HTML
├── test/              # WebdriverIO tests
│   ├── api.spec.ts
│   ├── application.spec.ts
│   ├── dom.spec.ts
│   └── interaction.spec.ts
├── wdio.conf.js       # WDIO configuration (CJS)
├── rollup.config.mjs  # Build configuration
└── package.json
```

## Features

- Window resize controls
- Dialog interactions
- Console logging
- IPC communication

## License

MIT
