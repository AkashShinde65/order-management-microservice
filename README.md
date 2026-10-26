
# Order Management System

A simple order management application built with React, Spring Boot and MySQL.

## Technologies
- Frontend: React
- Backend: Java, Spring Boot
- Database: MySQL
- Authentication: Spring Security, JWT
- Deployment: Docker and Docker Compose

## Features
- User registration and login
- Password hashing
- JWT authentication
- Create, view, update and delete orders
- User-specific order access
- Admin access to view all orders
- Request validation and error handling

## Run Locally

### 1. Database
Create the MySQL database:

```sql
CREATE DATABASE order_management;
```

Configure your local MySQL username and password in `application.properties`.

### 2. Backend

Set your JWT secret in the terminal:

```bash
export JWT_SECRET="$(openssl rand -base64 32)"
```

Start Spring Boot:

```bash
./mvnw spring-boot:run
```

Backend URL: http://localhost:8080

### 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Run with Docker

Create the `.env` file using the required database credentials and JWT secret, then run from the project root:

```bash
docker compose up --build
```

To stop the containers:

```bash
docker compose down
```

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/orders` | Create an order |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/{id}` | Get an order |
| PUT | `/api/orders/{id}` | Update an order |
| DELETE | `/api/orders/{id}` | Delete an order |

Order endpoints require a valid JWT in the Authorization header:

`Authorization: Bearer <token>`

## Security
- Passwords are hashed using BCrypt.
- JWTs are used for API authentication.
- Users can access only their own orders.
- Admin users can view all orders.

## Testing

Run backend tests:

```bash
./mvnw test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Database Schema

The application uses MySQL for runtime persistence.

A PostgreSQL-compatible schema is provided in
`database/postgresql_schema.sql` to address the schema-file
requirement in the assignment submission instructions.

The PostgreSQL schema is provided separately and is not used
by the application's MySQL configuration.

# order-management-microservice
