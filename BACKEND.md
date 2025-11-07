# Backend API Documentation

## Overview

The backend is a Fastify-based Node.js/TypeScript server that proxies OpenAI API calls. It runs exclusively on localhost for security.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install --ignore-scripts
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your OPENAI_API_KEY
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://127.0.0.1:3001`

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T18:00:00.000Z",
  "service": "xi-wei-backend",
  "version": "1.0.0",
  "model": "gpt-4o",
  "limits": {
    "rateLimitMax": 100,
    "rateLimitWindowMs": 60000,
    "maxRequestSizeBytes": 262144
  }
}
```

### POST /api/chat

Non-streaming chat completion endpoint.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 0.7,
  "maxTokens": 4096,
  "tools": [],
  "stream": false
}
```

**Response:**
```json
{
  "text": "Hello! How can I help you?",
  "cot": "Optional chain of thought",
  "toolCalls": []
}
```

**Headers:**
- `X-Request-ID`: Optional correlation ID

**Status Codes:**
- `200`: Success
- `400`: Invalid request (validation error)
- `429`: Rate limit exceeded
- `500`: Internal server error

### GET /api/chat/stream

Server-Sent Events (SSE) streaming endpoint.

**Query Parameters:**
- `messages`: URL-encoded JSON array of messages

**Example:**
```
GET /api/chat/stream?messages=%5B%7B%22role%22%3A%22user%22%2C%22content%22%3A%22Hello%22%7D%5D
```

**Response (SSE):**
```
data: {"text": "Hello"}
data: {"text": "!"}
data: {"text": " How"}
data: {"done": true}
```

**Headers:**
- `Content-Type: text/event-stream`
- `X-Request-ID`: Correlation ID

## Configuration

Environment variables (in `backend/.env.local`):

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (default: 3001)
- `HOST`: Bind address (default: 127.0.0.1)
- `OPENAI_MODEL`: Model to use (default: gpt-4o)
- `OPENAI_MAX_TOKENS`: Max tokens (default: 4096)
- `OPENAI_TEMPERATURE`: Temperature (default: 0.7)
- `RATE_LIMIT_MAX`: Requests per window (default: 100)
- `RATE_LIMIT_WINDOW_MS`: Window in ms (default: 60000)
- `MAX_REQUEST_SIZE_BYTES`: Max request size (default: 262144)

## Security

- Server binds to `127.0.0.1` only (localhost)
- CORS restricted to `http://localhost:5173`
- Rate limiting enabled
- Request size limits enforced
- API key never exposed to client

## Logging

Logs are written to `logs/backend-YYYY-MM-DD.ndjson` in structured JSON format.

Each log entry includes:
- Timestamp
- Level (debug/info/warn/error)
- Message
- Correlation ID (x-request-id)
- Additional context

## Error Handling

Errors are returned with appropriate HTTP status codes:

- `400`: Validation errors (Zod schema failures)
- `429`: Rate limit exceeded
- `500`: Internal server errors (OpenAI API failures, etc.)

All errors include a correlation ID in the response for debugging.

## Development

**Run in development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

**Run tests:**
```bash
npm test
```

## Troubleshooting

**Backend won't start:**
- Check if port 3001 is already in use
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check `logs/backend-dev.log` for errors

**CORS errors:**
- Ensure frontend is running on `http://localhost:5173`
- Check backend CORS configuration

**Rate limit errors:**
- Reduce request frequency
- Increase `RATE_LIMIT_MAX` in config (development only)

**OpenAI API errors:**
- Verify API key is valid
- Check API quota/limits
- Review error details in logs

