const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    _id: String,
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    address: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    adminId: {
        type: String,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
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

schoolSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('School', schoolSchema); 