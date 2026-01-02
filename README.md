# Kleo SDK

A TypeScript SDK for Node.js applications.

## Installation

```bash
npm install
```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Watch mode for development:**
   ```bash
   npm run build:watch
   ```

## Usage

### Basic Example

```typescript
import { KleoClient } from 'kleo-sdk';

// Initialize the client
const client = new KleoClient({
  apiKey: 'your-api-key-here',
  baseUrl: 'https://api.kleo.example.com', // Optional
  timeout: 30000, // Optional, default is 30000ms
});

// Make API calls
async function example() {
  try {
    // GET request
    const response = await client.get('/endpoint');
    console.log(response.data);

    // POST request
    const postResponse = await client.post('/endpoint', {
      key: 'value',
    });
    console.log(postResponse.data);

  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Configuration Options

- `apiKey` (required): Your API authentication key
- `baseUrl` (optional): Base URL for the API (default: `https://api.kleo.example.com`)
- `timeout` (optional): Request timeout in milliseconds (default: `30000`)

## Project Structure

```
kleo-sdk/
├── src/
│   ├── index.ts        # Main entry point
│   ├── client.ts       # SDK client implementation
│   └── types.ts        # TypeScript type definitions
├── examples/
│   └── basic-usage.ts  # Usage examples
├── dist/               # Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode for development
- `npm run clean` - Remove build artifacts
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## API Methods

The `KleoClient` provides the following methods:

- `get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>`
- `post<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>`
- `put<T>(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>`
- `delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>`

## License

MIT
SDK for Kleo Protocol.
