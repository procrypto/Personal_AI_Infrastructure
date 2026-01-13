# ApiDocs Workflow

**Generate API documentation from code.**

## When to Use

- Project has REST/GraphQL/tRPC API
- API documentation is missing or outdated
- User requests "document the API"

## Supported API Types

| Type | Detection | Extraction |
|------|-----------|------------|
| Express.js | `app.get()`, `router.post()` | Routes, middleware, params |
| Fastify | `fastify.get()`, route schemas | Routes, schemas, validation |
| Hono | `app.get()`, `Hono` imports | Routes, middleware |
| OpenAPI/Swagger | `openapi.json`, `swagger.yaml` | Full spec parsing |
| GraphQL | `.graphql` files, resolvers | Types, queries, mutations |
| tRPC | `router`, `procedure` | Procedures, input/output |

## Process

### Step 1: Detect API Type

```bash
# Check for indicators
grep -r "express\|fastify\|hono\|@trpc" package.json
ls openapi.json swagger.yaml schema.graphql 2>/dev/null
```

### Step 2: Extract Endpoints

**For REST APIs:**

```
For each route file:
  1. Find route definitions
  2. Extract: method, path, handler
  3. Parse JSDoc/comments for description
  4. Identify parameters (path, query, body)
  5. Find response types/schemas
  6. Note auth requirements (middleware)
```

**For OpenAPI/Swagger:**

```
1. Parse spec file
2. Extract paths, operations
3. Include schemas
4. Preserve examples
```

**For GraphQL:**

```
1. Parse schema files
2. Extract types, queries, mutations
3. Document resolvers
4. Include input/output types
```

### Step 3: Generate Documentation

**Load template:** `templates/ApiDocsTemplate.md`

**Structure:**

```markdown
# API Reference

Base URL: `{detected_base_url}`

## Authentication

{auth method if detected}

## Endpoints

### {Resource Group}

#### {METHOD} {path}

{description}

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|-----|----------|-------------|
| id | string | path | yes | Resource ID |

**Request Body:**

```json
{
  "field": "value"
}
```

**Response:**

```json
{
  "id": "123",
  "created": "2024-01-01"
}
```

**Example:**

```bash
curl -X GET https://api.example.com/resource/123 \
  -H "Authorization: Bearer $TOKEN"
```
```

### Step 4: Add Examples

For each endpoint, generate:
- curl example
- fetch/axios example (if JS project)
- Response example

### Step 5: Write and Validate

```
1. Write API.md
2. Validate all endpoints are documented
3. Check examples are syntactically correct
4. Report coverage
```

## Quality Checks

- [ ] All routes are documented
- [ ] Parameters have types and descriptions
- [ ] Response formats are shown
- [ ] Auth requirements are clear
- [ ] Examples are runnable

## Output Location

Default: `API.md` in project root

Alternative locations:
- `docs/api.md`
- `docs/API.md`
- Follows existing convention if present

## Template Reference

Uses: `templates/ApiDocsTemplate.md`
