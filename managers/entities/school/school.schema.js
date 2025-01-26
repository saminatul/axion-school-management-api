module.exports = {
    createSchool: [
        {
            path: 'name',
            type: 'string',
            required: true,
            length: {min: 3, max: 100}
        },
        {
            path: 'address',
            type: 'string',
            required: true,
            length: {min: 5, max: 200}
        },
        {
            path: 'email',
            type: 'string',
            required: true,
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        },
        {
            path: 'phone',
            type: 'string',
            required: true,
            length: {min: 10, max: 15}
        }
    ],
    updateSchool: [
        {
            path: 'schoolId',
            type: 'string',
            required: true
        },
        {
            path: 'name',
            type: 'string',
            length: {min: 3, max: 100}
        },
        {
            path: 'address',
            type: 'string',
            length: {min: 5, max: 200}
        },
        {
            path: 'email',
            type: 'string',
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        },
        {
            path: 'phone',
            type: 'string',
            length: {min: 10, max: 15}
        }
    ]
} 