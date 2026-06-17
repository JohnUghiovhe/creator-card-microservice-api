# Creator Card Microservice API

A standalone, layered-architecture REST API that allows creators to build, share, and delete bio profile cards with rate cards attached.

## Architecture Layer Blueprint
## Quick Start Configuration

### 1. Environmental Setup
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/creator_db?retryWrites=true&w=majority
```

### 2. Dependency Installation
```bash
npm install
```

### 3. Run Application Local Server
```bash
# Runs with Node v22 native environment flag parsing
npm run dev
```

---

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

### 3. Retrieve Private Profile (With Valid Pin Passed via Query)
```bash
curl -X GET "http://localhost:3000/creator-cards/vip-rate-card?access_code=A1B2C3"
```

### 4. Remove Card Soft Deletion Trigger
```bash
curl -X DELETE http://localhost:3000/creator-cards/ada-designs-things \
  -H "Content-Type: application/json" \
  -d '{
    "creator_reference": "crt_a1b2c3d4e5f6g7h8"
  }'
```