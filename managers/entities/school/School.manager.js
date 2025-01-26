const { nanoid } = require('nanoid');
const SchoolModel = require('./school.model');

module.exports = class School {
    constructor({utils, cache, config, cortex, managers, validators}={}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongo = managers.mongo;
        
        // Expose HTTP endpoints with auth middleware
        this.httpExposed = {
            post: ['__auth=createSchool'],
            get: ['__auth=getSchool', '__auth=listSchools'],
            put: ['__auth=updateSchool'],
            delete: ['__auth=deleteSchool']
        };

        // Log the exposed endpoints
        console.log('School manager exposed endpoints:', this.httpExposed);
    }

    async createSchool({name, address, email, phone, __auth}) {
        console.log('Creating school with data:', { name, address, email, phone });
        console.log('Auth user:', __auth?.user);

        // Only superadmin can create schools
        if (!__auth?.user || __auth.user.role !== 'superadmin') {
            console.log('Unauthorized: User role is not superadmin');
            return { error: 'Unauthorized: Only superadmin can create schools' };
        }

        // Validate input
        let result = await this.validators.school.createSchool({
            name, address, email, phone
        });

        if (result) {
            console.log('Validation failed:', JSON.stringify(result, null, 2));
            return { error: 'Validation failed', details: result };
        }

        try {
            // Check if school exists
            const existingSchool = await SchoolModel.findOne({ email });
            if (existingSchool) {
                console.log('School already exists with email:', email);
                return { error: 'School with this email already exists' };
            }

            // Create school
            const school = new SchoolModel({
                _id: nanoid(),
                name,
                address,
                email,
                phone,
                adminId: __auth.user.userId,
                active: true
            });

            console.log('Attempting to save school:', {
                _id: school._id,
                name: school.name,
                email: school.email,
                adminId: school.adminId
            });

            // Save to database
            const savedSchool = await school.save();
            console.log('School created successfully:', savedSchool._id);

            return { 
                ok: true,
                school: savedSchool.toObject() 
            };
        } catch (error) {
            console.error('Create school error:', error);
            return { 
                error: 'Failed to create school', 
                details: error.message,
                stack: error.stack
            };
        }
    }

    async updateSchool({schoolId, name, address, email, phone, __auth}) {
        console.log('Updating school:', { schoolId, name, email });

        // Validate input
        let result = await this.validators.school.updateSchool({
            schoolId, name, address, email, phone
        });

        if (result) {
            return { error: 'Validation failed', details: result };
        }

        try {
            const school = await SchoolModel.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }

            // Check authorization
            if (__auth.user.role !== 'superadmin') {
                return { error: 'Unauthorized: Only superadmin can update schools' };
            }

            // Update fields if provided
            if (name) school.name = name;
            if (address) school.address = address;
            if (email) school.email = email;
            if (phone) school.phone = phone;

            const updatedSchool = await school.save();
            return { school: updatedSchool };
        } catch (error) {
            console.error('Update school error:', error);
            return { error: 'Failed to update school', details: error.message };
        }
    }

    async getSchool({schoolId, __auth}) {
        try {
            const school = await SchoolModel.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }

            return { school };
        } catch (error) {
            console.error('Get school error:', error);
            return { error: 'Failed to get school', details: error.message };
        }
    }

    async listSchools({__auth}) {
        try {
            const schools = await SchoolModel.find({ active: true });
            return { schools };
        } catch (error) {
            console.error('List schools error:', error);
            return { error: 'Failed to list schools', details: error.message };
        }
    }

    async deleteSchool({schoolId, __auth}) {
        console.log('Deleting school:', schoolId);

        if (__auth.user.role !== 'superadmin') {
            return { error: 'Unauthorized: Only superadmin can delete schools' };
        }

        try {
            const school = await SchoolModel.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }

            // Soft delete
            school.active = false;
            await school.save();

            return { message: 'School deleted successfully' };
        } catch (error) {
            console.error('Delete school error:', error);
            return { error: 'Failed to delete school', details: error.message };
        }
    }
} 