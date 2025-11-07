# Security Documentation

## Overview

This document outlines security measures implemented in the Xi Wei Pharma experiment platform.

## API Key Security

### Backend Protection

- **Never exposed to client**: The OpenAI API key is stored exclusively in `backend/.env.local` (gitignored)
- **Server-side only**: All API calls are proxied through the backend server
- **Environment isolation**: Keys are loaded from environment variables, never hardcoded

### Key Management

1. Copy `backend/.env.example` to `backend/.env.local`
2. Add your OpenAI API key to `.env.local`
3. Never commit `.env.local` to version control
4. Rotate keys if accidentally exposed

## Network Security

### Localhost Binding

- **Backend binds to 127.0.0.1 only**: Server cannot accept external connections
- **No external access**: Even if port is forwarded, server rejects non-localhost origins

### CORS Configuration

- **Whitelist only**: CORS restricted to `http://localhost:5173` (Vite dev server)
- **Origin validation**: Server validates Origin header and rejects unauthorized requests
- **No wildcards**: Explicit origin matching prevents cross-site attacks

## Rate Limiting

### Protection Mechanisms

- **Per-IP limiting**: 100 requests per 60 seconds (configurable)
- **Request size limits**: Maximum 256 KiB per request
- **Timeout protection**: 60-second timeout on OpenAI API calls

### Configuration

Rate limits can be adjusted in `backend/.env.local`:
- `RATE_LIMIT_MAX`: Maximum requests per window
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds

## Input Validation

### Zod Schemas

All API inputs are validated using Zod schemas:
- Message arrays: Max 100 messages, each max 100KB
- Temperature: 0-2 range
- Max tokens: Positive integer, max 16000
- Tools: Array of strings

### Request Size Limits

- Maximum request body: 256 KiB
- Prevents DoS via large payloads
- Configurable via `MAX_REQUEST_SIZE_BYTES`

## Logging and Observability

### Structured Logging

- **NDJSON format**: Machine-readable logs in `logs/backend-*.ndjson`
- **Correlation IDs**: Every request gets unique `x-request-id` header
- **No secrets in logs**: API keys are redacted from log output

### Log Rotation

- Daily log files: `backend-YYYY-MM-DD.ndjson`
- Prevents disk space issues
- Easy to archive/export

## Dependency Security

### Package Management

- **Pinned versions**: All dependencies use exact versions
- **Regular audits**: Run `npm audit` to check for vulnerabilities
- **No known critical issues**: Current dependencies are vetted

### Update Process

1. Review changelogs
2. Test in development
3. Update package.json
4. Run full test suite
5. Deploy to production

## Data Privacy

### Local Storage

- **IndexedDB**: All data stored locally in browser
- **No external transmission**: Company data never leaves localhost
- **Export control**: Users can export/import experiment data

### API Key Exposure Prevention

- **No client-side storage**: API key never stored in browser
- **No network inspection**: Key only sent to OpenAI from backend
- **HTTPS for OpenAI**: Backend uses OpenAI's HTTPS API

## Best Practices

### For Developers

1. **Never commit secrets**: Use `.env.local` (gitignored)
2. **Use localhost only**: Don't expose backend to network
3. **Review logs regularly**: Check for suspicious activity
4. **Rotate keys periodically**: Change API keys every 90 days
5. **Monitor usage**: Track API costs and usage patterns

### For Operators

1. **Secure workstation**: Ensure development machine is secure
2. **Firewall rules**: Block external access to port 3001
3. **Regular backups**: Export experiment data regularly
4. **Access control**: Limit who can run the backend server

## Incident Response

### If API Key is Exposed

1. **Immediately revoke** the key in OpenAI dashboard
2. **Generate new key** and update `.env.local`
3. **Review logs** for unauthorized usage
4. **Monitor costs** for unexpected charges

### If Backend is Compromised

1. **Stop the server** immediately
2. **Review logs** for attack patterns
3. **Rotate API keys**
4. **Check for data exfiltration**
5. **Update dependencies** if vulnerability found

## Compliance Notes

- **Localhost only**: No data leaves your machine
- **No telemetry**: No external tracking or analytics
- **Full control**: You own all data and logs
- **Research use**: Designed for controlled experimentation

## Security Checklist

- [x] API key stored server-side only
- [x] Backend binds to localhost only
- [x] CORS restricted to frontend origin
- [x] Rate limiting enabled
- [x] Input validation with Zod
- [x] Request size limits
- [x] Structured logging with correlation IDs
- [x] Secrets redacted from logs
- [x] Dependencies pinned and audited
- [x] No external data transmission

## Reporting Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. **Contact** the project maintainer privately
3. **Provide** details of the vulnerability
4. **Wait** for confirmation before disclosure

