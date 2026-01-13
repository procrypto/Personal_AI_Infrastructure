# API Documentation Template

**Instructions:** Replace placeholders with actual endpoint information.

---

# API Reference

Base URL: `{base_url}`

Version: `{api_version}`

## Authentication

{auth_description}

### Authentication Methods

| Method | Header | Example |
|--------|--------|---------|
| {auth_type} | `{header_name}` | `{header_example}` |

## Rate Limiting

{rate_limit_description}

| Limit | Window | Scope |
|-------|--------|-------|
| {requests} | {window} | {scope} |

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### {Resource_Group}

#### {METHOD} {path}

{endpoint_description}

**Authentication:** {required|optional|none}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| `{param_name}` | `{type}` | {path|query|header} | {yes|no} | {description} |

**Request Body:**

```json
{
  "{field}": "{type} - {description}"
}
```

**Response:**

Status: `{status_code}`

```json
{
  "{field}": "{example_value}"
}
```

**Example Request:**

```bash
curl -X {METHOD} "{base_url}{path}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "{field}": "{value}"
  }'
```

**Example Response:**

```json
{
  "data": {
    "{field}": "{value}"
  }
}
```

---

## Webhooks

{webhooks_description}

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `{event_name}` | {description} | [Schema](#event_name-payload) |

### Webhook Payload

```json
{
  "event": "{event_name}",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... }
}
```

### Webhook Security

{webhook_security_description}

---

## SDKs & Libraries

| Language | Package | Install |
|----------|---------|---------|
| JavaScript | `{package_name}` | `npm install {package_name}` |
| Python | `{package_name}` | `pip install {package_name}` |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for API version history.

---

**Template Variables:**

| Variable | Description | Source |
|----------|-------------|--------|
| `{base_url}` | API base URL | Environment, config |
| `{api_version}` | Current version | package.json, config |
| `{auth_type}` | Auth method | Middleware detection |
| `{METHOD}` | HTTP method | Route definition |
| `{path}` | Endpoint path | Route definition |
| `{param_name}` | Parameter name | Route params, body schema |
| `{type}` | Data type | TypeScript types, schemas |
