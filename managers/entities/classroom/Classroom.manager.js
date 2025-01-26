const { nanoid } = require('nanoid');
const ClassroomModel = require('./classroom.model');
const SchoolModel = require('../school/school.model');

module.exports = class Classroom {
    constructor({utils, cache, config, cortex, managers, validators}={}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongo = managers.mongo;
        
        // Expose HTTP endpoints with auth middleware
        this.httpExposed = {
            post: ['__auth=__schoolAdminOnly=createClassroom'],
            get: ['__auth=getClassroom', '__auth=listClassrooms'],
            put: ['__auth=__schoolAdminOnly=updateClassroom'],
            delete: ['__auth=__schoolAdminOnly=deleteClassroom']
        };
    }

    async createClassroom({name, schoolId, capacity, grade, section, __auth}) {
        console.log('Creating classroom:', { name, schoolId, capacity, grade, section });

        // Validate input
        let result = await this.validators.classroom.createClassroom({
            name, schoolId, capacity, grade, section
        });

        if (result) {
            return { error: 'Validation failed', details: result };
        }

        try {
            // Check if school exists and user has access
            const school = await SchoolModel.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }

            // Verify user has access to this school
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only create classrooms for your school' };
            }

            // Create classroom
            const classroom = new ClassroomModel({
                _id: nanoid(),
                name,
                schoolId,
                capacity,
                grade,
                section,
                createdBy: __auth.user.userId,
                active: true
            });

            const savedClassroom = await classroom.save();
            return { classroom: savedClassroom };

        } catch (error) {
            console.error('Create classroom error:', error);
            if (error.code === 11000) {
                return { error: 'A classroom with this name already exists in this school' };
            }
            return { error: 'Failed to create classroom', details: error.message };
        }
    }

    async updateClassroom({classroomId, name, capacity, grade, section, __auth}) {
        console.log('Updating classroom:', { classroomId, name, capacity, grade, section });

        // Validate input
        let result = await this.validators.classroom.updateClassroom({
            classroomId, name, capacity, grade, section
        });

        if (result) {
            return { error: 'Validation failed', details: result };
        }

        try {
            const classroom = await ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { error: 'Classroom not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(classroom.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only update classrooms in your school' };
            }

            // Update fields if provided
            if (name) classroom.name = name;
            if (capacity) classroom.capacity = capacity;
            if (grade) classroom.grade = grade;
            if (section) classroom.section = section;

            const updatedClassroom = await classroom.save();
            return { classroom: updatedClassroom };

        } catch (error) {
            console.error('Update classroom error:', error);
            if (error.code === 11000) {
                return { error: 'A classroom with this name already exists in this school' };
            }
            return { error: 'Failed to update classroom', details: error.message };
        }
    }

    async getClassroom({classroomId, __auth}) {
        try {
            const classroom = await ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { error: 'Classroom not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(classroom.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only view classrooms in your school' };
            }

            return { classroom };
        } catch (error) {
            console.error('Get classroom error:', error);
            return { error: 'Failed to get classroom', details: error.message };
        }
    }

    async listClassrooms({schoolId, __auth}) {
        try {
            // If schoolId is provided, verify access
            if (schoolId) {
                const school = await SchoolModel.findById(schoolId);
                if (!school) {
                    return { error: 'School not found' };
                }

                if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                    return { error: 'Unauthorized: You can only view classrooms in your school' };
                }

                const classrooms = await ClassroomModel.find({ 
                    schoolId, 
                    active: true 
                });
                return { classrooms };
            }

            // If no schoolId, superadmin sees all, school admin sees their school's classrooms
            if (__auth.user.role === 'superadmin') {
                const classrooms = await ClassroomModel.find({ active: true });
                return { classrooms };
            } else {
                const school = await SchoolModel.findOne({ adminId: __auth.user.userId });
                if (!school) {
                    return { error: 'No school found for this administrator' };
                }
                const classrooms = await ClassroomModel.find({ 
                    schoolId: school._id, 
                    active: true 
                });
                return { classrooms };
            }
        } catch (error) {
            console.error('List classrooms error:', error);
            return { error: 'Failed to list classrooms', details: error.message };
        }
    }

    async deleteClassroom({classroomId, __auth}) {
        try {
            const classroom = await ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { error: 'Classroom not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(classroom.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only delete classrooms in your school' };
            }

            // Soft delete
            classroom.active = false;
            await classroom.save();

            return { message: 'Classroom deleted successfully' };
        } catch (error) {
            console.error('Delete classroom error:', error);
            return { error: 'Failed to delete classroom', details: error.message };
        }
    }
} 