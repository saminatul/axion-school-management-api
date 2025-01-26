const { nanoid } = require('nanoid');
const StudentModel = require('./student.model');
const SchoolModel = require('../school/school.model');
const ClassroomModel = require('../classroom/classroom.model');

module.exports = class Student {
    constructor({utils, cache, config, cortex, managers, validators}={}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongo = managers.mongo;
        
        // Expose HTTP endpoints with auth middleware
        this.httpExposed = {
            post: ['__auth=__schoolAdminOnly=createStudent'],
            get: ['__auth=getStudent', '__auth=listStudents'],
            put: [
                '__auth=__schoolAdminOnly=updateStudent',
                '__auth=__schoolAdminOnly=transferStudent'
            ],
            delete: ['__auth=__schoolAdminOnly=deleteStudent']
        };
    }

    async createStudent({firstName, lastName, dateOfBirth, gender, schoolId, classroomId, guardianInfo, __auth}) {
        console.log('Creating student:', { firstName, lastName, schoolId, classroomId });

        // Validate input
        let result = await this.validators.student.createStudent({
            firstName, lastName, dateOfBirth, gender, schoolId, classroomId, guardianInfo
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
                return { error: 'Unauthorized: You can only enroll students in your school' };
            }

            // Verify classroom exists and belongs to the school
            const classroom = await ClassroomModel.findOne({ _id: classroomId, schoolId });
            if (!classroom) {
                return { error: 'Classroom not found in this school' };
            }

            // Create student
            const student = new StudentModel({
                _id: nanoid(),
                firstName,
                lastName,
                dateOfBirth,
                gender,
                schoolId,
                classroomId,
                guardianInfo,
                createdBy: __auth.user.userId,
                active: true
            });

            const savedStudent = await student.save();
            return { student: savedStudent };

        } catch (error) {
            console.error('Create student error:', error);
            return { error: 'Failed to create student', details: error.message };
        }
    }

    async updateStudent({studentId, firstName, lastName, classroomId, guardianInfo, __auth}) {
        console.log('Updating student:', { studentId, firstName, lastName, classroomId });

        // Validate input
        let result = await this.validators.student.updateStudent({
            studentId, firstName, lastName, classroomId, guardianInfo
        });

        if (result) {
            return { error: 'Validation failed', details: result };
        }

        try {
            const student = await StudentModel.findById(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(student.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only update students in your school' };
            }

            // If changing classroom, verify it exists in the same school
            if (classroomId) {
                const classroom = await ClassroomModel.findOne({ 
                    _id: classroomId, 
                    schoolId: student.schoolId 
                });
                if (!classroom) {
                    return { error: 'Classroom not found in this school' };
                }
            }

            // Update fields if provided
            if (firstName) student.firstName = firstName;
            if (lastName) student.lastName = lastName;
            if (classroomId) student.classroomId = classroomId;
            if (guardianInfo) {
                student.guardianInfo = {
                    ...student.guardianInfo,
                    ...guardianInfo
                };
            }

            const updatedStudent = await student.save();
            return { student: updatedStudent };

        } catch (error) {
            console.error('Update student error:', error);
            return { error: 'Failed to update student', details: error.message };
        }
    }

    async transferStudent({studentId, toSchoolId, reason, __auth}) {
        console.log('Transferring student:', { studentId, toSchoolId, reason });

        // Validate input
        let result = await this.validators.student.transferStudent({
            studentId, toSchoolId, reason
        });

        if (result) {
            return { error: 'Validation failed', details: result };
        }

        try {
            const student = await StudentModel.findById(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }

            // Check current school access
            const currentSchool = await SchoolModel.findById(student.schoolId);
            if (__auth.user.role !== 'superadmin' && currentSchool.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only transfer students from your school' };
            }

            // Verify target school exists
            const targetSchool = await SchoolModel.findById(toSchoolId);
            if (!targetSchool) {
                return { error: 'Target school not found' };
            }

            // Add transfer record
            student.transferHistory.push({
                fromSchool: student.schoolId,
                toSchool: toSchoolId,
                date: new Date(),
                reason
            });

            // Update school and remove classroom assignment
            student.schoolId = toSchoolId;
            student.classroomId = null; // New school will assign classroom

            const updatedStudent = await student.save();
            return { 
                message: 'Student transferred successfully',
                student: updatedStudent 
            };

        } catch (error) {
            console.error('Transfer student error:', error);
            return { error: 'Failed to transfer student', details: error.message };
        }
    }

    async getStudent({studentId, __auth}) {
        try {
            const student = await StudentModel.findById(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(student.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only view students in your school' };
            }

            return { student };
        } catch (error) {
            console.error('Get student error:', error);
            return { error: 'Failed to get student', details: error.message };
        }
    }

    async listStudents({schoolId, classroomId, __auth}) {
        try {
            let query = { active: true };

            // If schoolId provided, verify access
            if (schoolId) {
                const school = await SchoolModel.findById(schoolId);
                if (!school) {
                    return { error: 'School not found' };
                }

                if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                    return { error: 'Unauthorized: You can only view students in your school' };
                }

                query.schoolId = schoolId;
            } else if (__auth.user.role !== 'superadmin') {
                // Non-superadmin must specify their school
                const school = await SchoolModel.findOne({ adminId: __auth.user.userId });
                if (!school) {
                    return { error: 'No school found for this administrator' };
                }
                query.schoolId = school._id;
            }

            // Add classroom filter if provided
            if (classroomId) {
                query.classroomId = classroomId;
            }

            const students = await StudentModel.find(query);
            return { students };
        } catch (error) {
            console.error('List students error:', error);
            return { error: 'Failed to list students', details: error.message };
        }
    }

    async deleteStudent({studentId, __auth}) {
        try {
            const student = await StudentModel.findById(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }

            // Check school access
            const school = await SchoolModel.findById(student.schoolId);
            if (__auth.user.role !== 'superadmin' && school.adminId !== __auth.user.userId) {
                return { error: 'Unauthorized: You can only delete students in your school' };
            }

            // Soft delete
            student.active = false;
            await student.save();

            return { message: 'Student deleted successfully' };
        } catch (error) {
            console.error('Delete student error:', error);
            return { error: 'Failed to delete student', details: error.message };
        }
    }
} 