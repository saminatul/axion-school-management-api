const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    _id: String,
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    schoolId: {
        type: String,
        ref: 'School',
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    grade: {
        type: String,
        required: true,
        trim: true
    },
    section: {
        type: String,
        required: true,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
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

classroomSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Compound index to ensure unique classroom name within a school
classroomSchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Classroom', classroomSchema); 