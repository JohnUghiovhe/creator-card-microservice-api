# Creator Card Microservice API

A standalone, layered-architecture REST API that allows creators to build, share, and delete bio profile cards with rate cards attached.

## Architecture Layer Blueprint

```
┌─────────────────────────────────────────────┐
│              Endpoints Layer                │
│  (endpoints/creator-cards/)                 │
│  create.js  get.js  delete.js  health.js    │
│  HTTP routing, request extraction, response │
├─────────────────────────────────────────────┤
│              Services Layer                 │
│  (services/creator-card-processor/)         │
│  create-card.js  get-card.js  delete-card.js│
│  Business logic, validation, DB operations  │
├─────────────────────────────────────────────┤
│               Core Layer                    │
│  core/express/   - HTTP server & helpers    │
│  core/errors/    - Error codes & thrower    │
│  core/mongoose/  - MongoDB connection mgmt  │
│  core/logger/    - Structured JSON logging  │
│  core/randomness/- ULID generation           │
│  core/validator-vsl/ - VSL schema engine    │
├─────────────────────────────────────────────┤
│              Messages Layer                 │
│  (messages/)                                │
│  Centralized error message strings          │
└─────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Endpoints** — Thin HTTP handlers. Extract params/body/query from requests, delegate to services, return formatted responses.
- **Services** — Business logic and data access. Validate inputs via VSL schemas, enforce access rules, perform CRUD against MongoDB.
- **Core** — Shared infrastructure modules (server framework, error system, database client, logger, ID generation, validation engine).
- **Messages** — Single source of truth for all user-facing error messages.

## Quick Start Configuration

### 1. Environmental Setup

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/creator_db?retryWrites=true&w=majority
```

> **Note:** The application reads `MONGO_URI` (not `MONGODB_URI`). Set this to your MongoDB Atlas or local MongoDB connection string.

### 2. Dependency Installation

```bash
npm install
```

### 3. Run Application Local Server

```bash
# Uses Node v22 native --env-file flag for .env parsing
npm run dev
```

## API Reference

### Health Check

Verifies the service is running.

```
GET /health
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": { "uptime": true }
}
```

---

### Create a Creator Card

Creates a new bio profile card. Auto-generates a slug from the title when `slug` is omitted.

```
POST /creator-cards
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | 3–100 characters |
| `description` | string | no | max 500 characters |
| `slug` | string | no | 5–50 chars; auto-generated from title if omitted |
| `creator_reference` | string | yes | exactly 20 characters |
| `links` | array | no | Array of `{ title, url }` objects |
| `service_rates` | object | no | `{ currency (NGN\|USD\|GBP\|GHS), rates[] }` |
| `status` | string | yes | `draft` or `published` |
| `access_type` | string | no | `public` (default) or `private` |
| `access_code` | string | no | 6 characters; required when `access_type` is `private` |

**Response `200 OK`:**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "<ulid>",
    "title": "George Cooks",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published",
    "access_type": "public",
    "links": [],
    "service_rates": null,
    "created": 1719000000000,
    "updated": 1719000000000,
    "deleted": null
  }
}
```

**Error Codes:** `VALIDATIONERR`, `SL02`, `AC01`, `AC05`

---

### Get a Creator Card

Retrieves a published creator card by its slug. For private cards, an `access_code` query parameter is required.

```
GET /creator-cards/:slug?access_code=<code>
```

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `slug` | URL-safe slug of the card |

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `access_code` | only for private cards | 6-character access code |

**Response `200 OK`:**

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "<ulid>",
    "title": "George Cooks",
    "slug": "george-cooks",
    "status": "published",
    "access_type": "public",
    "links": [],
    "service_rates": null,
    "created": 1719000000000,
    "updated": 1719000000000,
    "deleted": null
  }
}
```

> **Note:** The `access_code` field is never returned in the response. Private cards that are missing or supply an invalid access code receive the same generic "not found" message.

**Error Codes:** `NF01`, `NF02`, `AC03`, `AC04`

---

### Delete a Creator Card (Soft Delete)

Performs a soft delete by setting a `deleted` timestamp. The card is not removed from the database.

```
DELETE /creator-cards/:slug
Content-Type: application/json
```

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `slug` | URL-safe slug of the card |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `creator_reference` | string | yes | exactly 20 characters; proof of ownership |

**Response `200 OK`:**

```json
{
  "status": "success",
  "message": "Creator Card Deleted Successfully.",
  "data": {
    "id": "<ulid>",
    "title": "Ada Designs Things",
    "slug": "ada-designs-things",
    "creator_reference": "crt_a1b2c3d4e5f6g7h8",
    "deleted": 1719000000000,
    "updated": 1719000000000
  }
}
```

**Error Codes:** `VALIDATIONERR`, `NF01`

## Error Codes

| Code | Meaning |
|------|---------|
| `VALIDATIONERR` | Request body failed schema validation |
| `SL02` | Slug is already taken |
| `NF01` | Card not found (slug does not exist or was deleted) |
| `NF02` | Card is in `draft` status (treated as not found) |
| `AC01` | `access_code` is required when `access_type` is `private` |
| `AC03` | `access_code` query param missing for private card |
| `AC04` | Invalid `access_code` supplied |
| `AC05` | `access_code` cannot be set on `public` cards |

All errors return:

```json
{
  "status": "error",
  "message": "Human-readable description",
  "code": "ERROR_CODE"
}
```

## Deployment

The project includes a [`render.yaml`](./render.yaml) for one-click deployment on [Render](https://render.com). The `MONGO_URI` environment variable must be configured manually (stored as a Render secret).

## Evaluation Test Matrix

### 1. Create a Public Published Card

```bash
curl -X POST http://localhost:3000/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [{"title": "YouTube", "url": "https://youtube.com"}],
    "service_rates": {
      "currency": "NGN",
      "rates": [{"name": "IG Story Post", "description": "One story mention", "amount": 5000000}]
    },
    "status": "published"
  }'
```

### 2. Auto-Generate Slug (Missing Slug Parameter)

```bash
curl -X POST http://localhost:3000/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ada Designs Things",
    "creator_reference": "crt_a1b2c3d4e5f6g7h8",
    "status": "published"
  }'
```

The slug is auto-generated from the title (`ada-designs-things`). If the base slug is under 5 characters or conflicts with an existing card, a random 6-character suffix is appended.

### 3. Retrieve a Card (Public) and Private Card (With Access Code)

**Public card (no access_code needed):**

```bash
curl -X GET "http://localhost:3000/creator-cards/george-cooks"
```

**Private card (valid access_code required):**

```bash
curl -X GET "http://localhost:3000/creator-cards/vip-rate-card?access_code=A1B2C3"
```

### 4. Soft Delete a Card

```bash
curl -X DELETE http://localhost:3000/creator-cards/ada-designs-things \
  -H "Content-Type: application/json" \
  -d '{
    "creator_reference": "crt_a1b2c3d4e5f6g7h8"
  }'
```

The card is soft-deleted (a `deleted` timestamp is set) and will no longer appear in GET queries.
