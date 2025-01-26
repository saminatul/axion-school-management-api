# Student Management API Documentation

## Overview
The Student Management API provides endpoints to manage student enrollment, profiles, and transfers within schools. It supports role-based access control where school administrators can manage students within their assigned schools.

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the Authorization header: 


## Role-Based Access
- **Superadmin**: Can manage students in any school
- **School Admin**: Can only manage students in their assigned school

## API Endpoints

### Create Student (Enrollment)


## Validation Rules

1. **Personal Information**
   - First and last names: 2-50 characters
   - Valid date of birth
   - Gender must be one of: male, female, other

2. **School Assignment**
   - Valid school ID
   - Valid classroom ID within the school

3. **Guardian Information**
   - Guardian name: 2-100 characters
   - Valid phone number (10-15 digits)
   - Valid email format
   - Address: 5-200 characters

## Authorization Rules

1. **School Admin**
   - Can only manage students in their assigned school
   - Can enroll new students
   - Can update student information
   - Can initiate transfers from their school
   - Can view students in their school

2. **Superadmin**
   - Can manage students in any school
   - Can view all students
   - Can approve/process transfers

## Transfer Process

1. **Initiation**
   - Source school admin initiates transfer
   - Requires target school ID and reason
   - Student's current enrollment is maintained until transfer is complete

2. **Processing**
   - Student's classroom assignment is cleared
   - Transfer history is updated
   - New school can assign new classroom

## Error Handling

Common error responses:


Common error scenarios:
- Invalid student ID
- Unauthorized school access
- Invalid classroom assignment
- Validation failures
- Transfer to non-existent school

## Testing

See `test/student.rest` for complete API test examples including:
- Student enrollment flow
- Profile updates
- School transfers
- Authorization checks
- Error scenarios

## Notes
- All dates are in ISO 8601 format
- Soft deletion is used (active flag)
- Transfer history is maintained
- Guardian information can be partially updated