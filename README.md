# Task Manager API

This project is a RESTful API for managing tasks. Users can create, read, update, and delete tasks, with features such as task sharing, filtering, and assignment management. Additionally, the API includes user authentication and authorization with JWT, rate limiting for security, and request validation.

## Technologies Used

- **Node.js**: JavaScript runtime.
- **Express**: Web framework for Node.js.
- **TypeScript**: Typed superset of JavaScript.
- **TypeORM**: Object-Relational Mapping (ORM) for managing database operations.
- **PostgreSQL**: Database for persistent data storage.
- **Upstash Redis**: Serverless Redis for caching and rate limiting.
- **Joi**: Data validation library for request validation.
- **Nodemailer**: Email library used to notify users.
- **Swagger**: API documentation, accessible at [Swagger Docs](http://localhost:5000/api-docs/#/).
- **Rate Limiting**: Controls the number of requests a user can make in a given timeframe.
- **dotenv**: Loads environment variables from a `.env` file.

## Features

1. **User Authentication and Authorization**: Authenticated users can create and share tasks.
2. **Task Management**: CRUD operations on tasks, filtering, and sorting.
3. **Rate Limiting**: Controls the number of requests a user can make in a given timeframe.
4. **Data Validation**: Uses Joi to validate incoming request data.
5. **Caching**: Uses Upstash Redis to cache task queries for improved performance.
6. **API Documentation**: Access the [Swagger Documentation](https://discreet-moth.static.domains/) to explore all available endpoints.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (>= 14.x)
- **PostgreSQL** (or configure for your preferred database)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Hardeezah/task-management.git
   cd task-management``

2. Install dependencies:
    ```npm install```

3. Configure Environment Variables:

    * Create a .env file in the root of the project.
    * Add the following variables to the .env file:
    
    ```bash PORT=5000
    DATABASE_URL=postgres://user:password@localhost:5432/taskmanager
    UPSTASH_REDIS_URL=your_upstash_redis_url
    JWT_SECRET=your_jwt_secret
    EMAIL_USER=your_email@example.com
    EMAIL_PASS=your_email_password```

4. Database Setup:

    * Ensure PostgreSQL is running.
    * Run the database migrations to create the required tables:


    ```npm run migration:run```

5. Swagger Documentation:

    * The API documentation can be viewed at Swagger.

### Running the Project
    To start the server:

    ``` npm run dev```

 The API will be accessible at http://localhost:5000.

### Running Tests
    To run the unit tests:

    ```npm test```

### API Endpoints

| Endpoint       | Method | Description                                         |
|----------------|--------|-----------------------------------------------------|
| `/users/register` | POST   | Register a new user      
| `/users/verify-otp` | POST   | Verify user email to create account                           |
| `/users/login`    | POST   | Login a user and retrieve a JWT                     |
| `/tasks`         | POST   | Create a new task (authenticated)                   |
| `/tasks`         | GET    | Get all tasks with pagination and filters           |
| `/tasks/:id`     | GET    | Get a task by ID                                   |
| `/tasks/:id`     | PUT    | Update a task by ID (must be task owner or assigned)|
| `/tasks/:id`     | DELETE | Delete a task by ID (must be task owner or assigned)|
| `/tasks/share`   | POST   | Share a task with another user by email             |

### Task Data Validation

Task fields such as title, description, dueDate, and priority are validated with Joi to ensure data consistency and integrity. This prevents invalid data from reaching the database and improves error handling.



