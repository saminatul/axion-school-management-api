# School Management API Documentation

## Overview
The School Management API provides endpoints to manage schools in the system. It implements role-based access control where superadmins have full system access while school administrators have limited access to their assigned schools.

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header: 

Authorization: Bearer <your_jwt_token>

## Role-Based Access
- **Superadmin**: Full access to create, manage, and delete schools
- **School Admin**: Can only view and manage their assigned school

## API Endpoints

### Create School

POST /api/school/createSchool
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "name": "Example School",
    "address": "123 Education St",
    "email": "school@example.com",
    "phone": "1234567890"
}

**Required Role:** Superadmin only

### Get School

GET /api/school/getSchool
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "schoolId": "school_id"
}

### List Schools

GET /api/school/listSchools
Content-Type: application/json
Authorization: Bearer <your_token>

### Update School

PUT /api/school/updateSchool
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "schoolId": "school_id",
    "name": "Updated School Name",    // optional
    "address": "New Address",         // optional
    "email": "new.email@school.com",  // optional
    "phone": "9876543210"            // optional
}

### Delete School

DELETE /api/school/deleteSchool
Content-Type: application/json
Authorization: Bearer <your_token>

{
    "schoolId": "school_id"
}

## Data Models

### School Schema

{
    _id: String,
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100
    },
    address: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    adminId: {
        type: String,
        ref: 'User',
        required: true
    },
    active: Boolean,
    createdAt: Date,
    updatedAt: Date
}

## Validation Rules

1. **Name**
   - Required
   - Length: 3-100 characters
   - Must be unique

2. **Address**
   - Required
   - Length: 5-200 characters

3. **Email**
   - Required
   - Valid email format
   - Must be unique in the system

4. **Phone**
   - Required
   - Valid phone number format
   - Length: 10-15 digits

## Authorization Rules

1. **Superadmin**
   - Can create new schools
   - Can assign school administrators
   - Can update any school's information
   - Can view all schools
   - Can delete schools (soft delete)

2. **School Admin**
   - Can view their assigned school
   - Can update their school's information
   - Cannot create or delete schools
   - Cannot view other schools

## Features

### 1. School Management
- Complete CRUD operations
- Soft deletion support
- Unique email enforcement
- Audit trail (creation and update timestamps)

### 2. Administrator Assignment
- Schools must have an assigned administrator
- Administrators can only manage their assigned school
- Superadmin can reassign administrators

### 3. Integration with Other Modules
- Links to Classroom management
- Links to Student management
- Links to User management (for admin assignment)

### 4. Data Validation
- Input validation for all fields
- Email format verification
- Phone number format checking
- Duplicate prevention

## Error Handling

Common error responses:

{
    "error": "Error message",
    "details": "Optional detailed error information"
}

Common error scenarios:
- Unauthorized access attempts
- Duplicate school email
- Invalid input data
- School not found
- Operation not permitted for role

## Testing

See `test/school.rest` for complete API test examples including:
- School creation
- Administrator assignment
- Information updates
- Authorization checks
- Error scenarios

## Example Workflows

### 1. Complete School Setup

# 1. Create School (as superadmin)
POST /api/school/createSchool
{
    "name": "New School",
    "address": "123 Education St",
    "email": "school@example.com",
    "phone": "1234567890"
}

# 2. Assign School Admin
# (Handled through User Management API)

# 3. Set up Initial Classrooms
# (Using Classroom Management API)

### 2. School Information Update

# 1. Get Current School Info
GET /api/school/getSchool
{
    "schoolId": "school_id"
}

# 2. Update School Details
PUT /api/school/updateSchool
{
    "schoolId": "school_id",
    "address": "New Address",
    "phone": "9876543210"
}

## Notes and Best Practices

1. **Security**
   - Always verify role permissions
   - Validate all input data
   - Use secure communication (HTTPS)

2. **Data Management**
   - Use soft deletes to preserve history
   - Maintain audit trails
   - Enforce unique constraints

3. **Integration**
   - Coordinate with user management for admin assignment
   - Ensure classroom associations are handled properly
   - Maintain student records when updating school information

4. **Performance**
   - Index frequently queried fields
   - Implement pagination for large datasets
   - Cache frequently accessed data

## Related Documentation
- User Authentication API
- Classroom Management API
- Student Management API
```

This documentation provides a complete overview of the School Management API, including:
- All available endpoints
- Data models and validation rules
- Authorization requirements
- Features and capabilities
- Integration points with other modules
- Best practices and implementation notes

