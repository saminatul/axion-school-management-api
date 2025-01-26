module.exports = {
    createStudent: [
        {
            path: 'firstName',
            type: 'string',
            required: true,
            length: {min: 2, max: 50}
        },
        {
            path: 'lastName',
            type: 'string',
            required: true,
            length: {min: 2, max: 50}
        },
        {
            path: 'dateOfBirth',
            type: 'date',
            required: true
        },
        {
            path: 'gender',
            type: 'string',
            required: true,
            oneOf: ['male', 'female', 'other']
        },
        {
            path: 'schoolId',
            type: 'string',
            required: true
        },
        {
            path: 'classroomId',
            type: 'string',
            required: true
        },
        {
            path: 'guardianInfo',
            type: 'object',
            required: true,
            schema: [
                {
                    path: 'name',
                    type: 'string',
                    required: true,
                    length: {min: 2, max: 100}
                },
                {
                    path: 'relationship',
                    type: 'string',
                    required: true
                },
                {
                    path: 'contact',
                    type: 'object',
                    required: true,
                    schema: [
                        {
                            path: 'phone',
                            type: 'string',
                            required: true,
                            length: {min: 10, max: 15}
                        },
                        {
                            path: 'email',
                            type: 'string',
                            required: true,
                            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                        },
                        {
                            path: 'address',
                            type: 'string',
                            required: true,
                            length: {min: 5, max: 200}
                        }
                    ]
                }
            ]
        }
    ],
    updateStudent: [
        {
            path: 'studentId',
            type: 'string',
            required: true
        },
        {
            path: 'firstName',
            type: 'string',
            length: {min: 2, max: 50}
        },
        {
            path: 'lastName',
            type: 'string',
            length: {min: 2, max: 50}
        },
        {
            path: 'classroomId',
            type: 'string'
        },
        {
            path: 'guardianInfo',
            type: 'object',
            schema: [
                {
                    path: 'name',
                    type: 'string',
                    length: {min: 2, max: 100}
                },
                {
                    path: 'relationship',
                    type: 'string'
                },
                {
                    path: 'contact',
                    type: 'object',
                    schema: [
                        {
                            path: 'phone',
                            type: 'string',
                            length: {min: 10, max: 15}
                        },
                        {
                            path: 'email',
                            type: 'string',
                            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                        },
                        {
                            path: 'address',
                            type: 'string',
                            length: {min: 5, max: 200}
                        }
                    ]
                }
            ]
        }
    ],
    transferStudent: [
        {
            path: 'studentId',
            type: 'string',
            required: true
        },
        {
            path: 'toSchoolId',
            type: 'string',
            required: true
        },
        {
            path: 'reason',
            type: 'string',
            required: true,
            length: {min: 5, max: 200}
        }
    ]
} 