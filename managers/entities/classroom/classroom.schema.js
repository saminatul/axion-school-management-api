module.exports = {
    createClassroom: [
        {
            path: 'name',
            type: 'string',
            required: true,
            length: {min: 2, max: 50}
        },
        {
            path: 'schoolId',
            type: 'string',
            required: true
        },
        {
            path: 'capacity',
            type: 'number',
            required: true,
            min: 1,
            max: 100
        },
        {
            path: 'grade',
            type: 'string',
            required: true,
            length: {min: 1, max: 20}
        },
        {
            path: 'section',
            type: 'string',
            required: true,
            length: {min: 1, max: 10}
        }
    ],
    updateClassroom: [
        {
            path: 'classroomId',
            type: 'string',
            required: true
        },
        {
            path: 'name',
            type: 'string',
            length: {min: 2, max: 50}
        },
        {
            path: 'capacity',
            type: 'number',
            min: 1,
            max: 100
        },
        {
            path: 'grade',
            type: 'string',
            length: {min: 1, max: 20}
        },
        {
            path: 'section',
            type: 'string',
            length: {min: 1, max: 10}
        }
    ]
} 