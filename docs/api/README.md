# API Documentation

This directory contains the OpenAPI 3.0 specification for the Demo Vibe E-Commerce API.

## Files

- `openapi.yaml` - Complete OpenAPI 3.0.3 specification covering all API endpoints

## Viewing the API Docs

### Option 1: Swagger Editor (online)

1. Go to [https://editor.swagger.io](https://editor.swagger.io)
2. Click **File > Import file** and select `openapi.yaml`
3. The interactive documentation will render in the right panel

### Option 2: Swagger UI (local via Docker)

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/openapi.yaml \
  -v $(pwd)/docs/api:/api \
  swaggerapi/swagger-ui
```

Then open [http://localhost:8080](http://localhost:8080).

### Option 3: Redocly CLI (local)

```bash
npx @redocly/cli preview-docs docs/api/openapi.yaml
```

Then open the URL printed in the terminal (default: [http://localhost:8080](http://localhost:8080)).

### Option 4: VS Code Extension

Install the **OpenAPI (Swagger) Editor** extension (id: `42Crunch.vscode-openapi`) and open `openapi.yaml`. Use the preview panel for an interactive view.

## API Modules

| Module | Base Path | Auth Required | Description |
|--------|-----------|---------------|-------------|
| Auth | `/api/auth` | Varies | Signup, login, token management, profile, password |
| Auth - Social | `/api/auth/social` | No | OAuth2 login (Google, Kakao, Naver) |
| Products | `/api/products` | Varies | Product catalog CRUD |
| Orders | `/api/orders` | Yes | Buyer order management |
| Orders - Seller | `/api/orders/sales` | Yes (SELLER/ADMIN) | Seller fulfillment management |
| Admin - Dashboard | `/api/admin/dashboard` | Yes (ADMIN) | Dashboard overview |
| Admin - Users | `/api/admin/users` | Yes (ADMIN) | User management |
| Board | `/api/posts` | Varies | Community posts and comments |
| Search | `/api/search` | No | Full-text product search |

## Response Format

All responses follow a standard envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

## Authentication

The API uses JWT Bearer tokens. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /api/auth/login` or `POST /api/auth/signup`.
