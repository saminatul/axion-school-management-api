# School Management System API

A comprehensive API system for managing schools, classrooms, and students with role-based access control.

## Features

### 1. User Management
- Role-based authentication (Superadmin, School Admin)
- Secure JWT-based authentication
- User profile management

### 2. School Management
- Complete school profile management
- Administrator assignment
- Multiple schools support
- Location and contact information

### 3. Classroom Management
- Classroom creation and assignment
- Capacity management
- Grade and section tracking
- School-specific classroom organization

### 4. Student Management
- Student enrollment system
- Profile management
- School transfer capabilities
- Guardian information tracking
- Classroom assignment

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
bash
git clone git@github.com:saminatul/axion-school-management-api.git

npm install


3. Configure environment variables
cp .env.example .env


Edit .env with your configuration
4. Start the server
bash
npx nodemon index.js


## API Documentation

Detailed API documentation is available in the `docs/api` directory:
- [School Management](docs/api/school.md)
- [Classroom Management](docs/api/classroom.md)
- [Student Management](docs/api/student.md)

### Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

Authorization: Bearer <your_jwt_token>


### Role-Based Access

1. **Superadmin**
   - Full system access
   - Can manage all schools
   - Can create school administrators
   - Can manage all classrooms and students

2. **School Admin**
   - Access limited to assigned school
   - Can manage school's classrooms
   - Can manage school's students
   - Can process student transfers

## API Testing

REST API test files are provided in the `test` directory:
- `test/auth.rest`: Authentication endpoints
- `test/school.rest`: School management endpoints
- `test/classroom.rest`: Classroom management endpoints
- `test/student.rest`: Student management endpoints

### Using Test Files

1. Install REST Client extension in VS Code
2. Open any .rest file
3. Click "Send Request" above each request
4. View response in split pane

## Project Structure

├── managers/
│ ├── api/
│ │ └── Api.manager.js
│ └── entities/
│ ├── user/
│ ├── school/
│ ├── classroom/
│ └── student/
├── docs/
│ └── api/
│ ├── school.md
│ ├── classroom.md
│ └── student.md
├── test/
│ ├── auth.rest
│ ├── school.rest
│ ├── classroom.rest
│ └── student.rest
└── README.md

## API Endpoints Summary

### Authentication
- POST `/api/user/createUser`: Create new user
- POST `/api/user/loginUser`: User login

### Schools
- POST `/api/school/createSchool`: Create new school
- GET `/api/school/getSchool`: Get school details
- GET `/api/school/listSchools`: List all schools
- PUT `/api/school/updateSchool`: Update school
- DELETE `/api/school/deleteSchool`: Delete school

### Classrooms
- POST `/api/classroom/createClassroom`: Create classroom
- GET `/api/classroom/getClassroom`: Get classroom details
- GET `/api/classroom/listClassrooms`: List classrooms
- PUT `/api/classroom/updateClassroom`: Update classroom
- DELETE `/api/classroom/deleteClassroom`: Delete classroom

### Students
- POST `/api/student/createStudent`: Enroll student
- GET `/api/student/getStudent`: Get student details
- GET `/api/student/listStudents`: List students
- PUT `/api/student/updateStudent`: Update student
- PUT `/api/student/transferStudent`: Transfer student
- DELETE `/api/student/deleteStudent`: Delete student

## Error Handling

The API uses standard HTTP response codes and returns errors in the following format:

json
{
"ok": false,
"error": "Error message",
"details": "Optional detailed error information"
}


## Success Responses

Successful responses follow this format:

json
{
"ok": true,
"data": {
// Response data
}
}


## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details