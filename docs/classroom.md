# Classroom Management API Documentation

## Overview
The Classroom Management API provides endpoints to manage classrooms within schools. It supports role-based access control where superadmins can manage all classrooms across schools, while school administrators can only manage classrooms within their assigned school.

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header:

## Role-Based Access
- **Superadmin**: Can manage classrooms in any school
- **School Admin**: Can only manage classrooms in their assigned school

## API Endpoints

### Create Classroom


## Authorization Rules

1. **Superadmin**
   - Can manage classrooms in any school
   - Full access to all endpoints
   - Can view all classrooms across schools

2. **School Admin**
   - Can only manage classrooms in their assigned school
   - Must provide valid schoolId matching their assignment
   - Cannot access classrooms from other schools

## Validation Rules

1. **Name**
   - Required
   - Length: 2-50 characters
   - Must be unique within a school

2. **Capacity**
   - Required
   - Range: 1-100 students
   - Must be a positive integer

3. **Grade**
   - Required
   - Valid string format

4. **Section**
   - Required
   - Valid string format

## Testing

See `test/classroom.rest` for complete API test examples including:
- Authentication flow
- CRUD operations
- Error scenarios
- Authorization checks