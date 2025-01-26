module.exports = {
    createUser: [
        {
            path: 'username',
            type: 'string',
            required: true,
            length: {min: 3, max: 20}
        },
        {
            path: 'email',
            type: 'string',
            required: true,
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        },
        {
            path: 'password',
            type: 'string',
            required: true,
            length: {min: 8, max: 100}
        },
        {
            path: 'role',
            type: 'string',
            required: true,
            oneOf: ['superadmin', 'school_admin']
        }
    ]
}


