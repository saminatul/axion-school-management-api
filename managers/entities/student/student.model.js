const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    _id: String,
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    schoolId: {
        type: String,
        ref: 'School',
        required: true
    },
    classroomId: {
        type: String,
        ref: 'Classroom',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    guardianInfo: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        relationship: {
            type: String,
            required: true,
            trim: true
        },
        contact: {
            phone: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            address: {
                type: String,
                required: true
            }
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    transferHistory: [{
        fromSchool: String,
        toSchool: String,
        date: Date,
        reason: String
    }],
    createdBy: {
        type: String,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

studentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Compound index for efficient queries
studentSchema.index({ schoolId: 1, classroomId: 1 });
studentSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model('Student', studentSchema); 