# Backend API

Simple Node.js backend to query user information from PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
   - Update `DB_NAME`, `DB_USER`, `DB_PASSWORD` with your PostgreSQL credentials

3. Make sure PostgreSQL is running and the database schema is initialized using `init.sql`

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoint

### Get First Name by Username

**Endpoint:** `GET /api/user/firstname/:username`

**Example:**
```bash
curl http://localhost:3000/api/user/firstname/john_doe
```

**Response (Success):**
```json
{
  "username": "john_doe",
  "firstName": "John"
}
```

**Response (Not Found):**
```json
{
  "error": "User not found",
  "message": "No user found with username: john_doe"
}
```

## Health Check

**Endpoint:** `GET /health`

Check if the server is running:
```bash
curl http://localhost:3000/health
```
