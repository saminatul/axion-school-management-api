const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const UserModel = require('./user.model');

module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.mongo               = managers.mongo;
        this.usersCollection     = "users";
        this.httpExposed         = [
            'createUser',
            'loginUser'
        ];
        this.SALT_ROUNDS         = 10;
    }

    async createUser({username, email, password, role}){
        // console.log('Creating user with data:', { 
        //     username, 
        //     email, 
        //     role,
        //     passwordLength: password ? password.length : 0 
        // });

        // Validate role
        if (!['superadmin', 'school_admin'].includes(role)) {
            console.log('Invalid role:', role);
            return { error: 'Invalid role' };
        }

        // Data validation
        let result = await this.validators.user.createUser({
            username,
            email,
            password,
            role
        });

        if(result) {
            console.log('Validation failed:', JSON.stringify(result, null, 2));
            return { 
                error: 'Validation failed',
                details: result 
            };
        }
        
        try {
            // Check if user exists
            const existingUser = await UserModel.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                console.log('User already exists:', { email, username });
                return { error: 'User already exists' };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
            
            // Create user object
            const userKey = nanoid();
            const user = new UserModel({
                _id: nanoid(),
                username,
                email,
                password: hashedPassword,
                role,
                key: userKey,
                active: true
            });

            console.log('Attempting to save user:', { 
                _id: user._id, 
                username: user.username,
                email: user.email,
                role: user.role 
            });

            // Save to MongoDB
            const savedUser = await user.save();
            console.log('User saved successfully:', savedUser._id);
            
            // Generate token
            let longToken = this.tokenManager.genLongToken({
                userId: user._id, 
                userKey: user.key,
                role: user.role
            });
            
            // Return sanitized user (without password)
            const {password: _, ...safeUser} = user.toObject();
            return {
                user: safeUser, 
                longToken
            };
        } catch (error) {
            console.error('Create user error:', error);
            if (error.code === 11000) {
                return { error: 'Username or email already exists' };
            }
            return { error: 'Failed to create user', details: error.message };
        }
    }

    async loginUser({email, password}) {
        // console.log('Login attempt for:', email);
        try {
            // Find user
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                console.log('User not found:', email);
                return {error: 'Invalid credentials'};
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Invalid password for user:', email);
                return {error: 'Invalid credentials'};
            }

            console.log('Successful login for user:', email);
            let longToken = this.tokenManager.genLongToken({
                userId: user._id, 
                userKey: user.key,
                role: user.role
            });

            const {password: _, ...safeUser} = user.toObject();
            return {
                user: safeUser,
                longToken
            };
        } catch (error) {
            console.error('Login error:', error);
            return { error: 'Login failed', details: error.message };
        }
    }

    // Helper method to list all users (for debugging)
    async listUsers() {
        try {
            const users = await UserModel.find({}, { password: 0 });
            // console.log('All users:', users);
            return users;
        } catch (error) {
            console.error('Error listing users:', error);
            return [];
        }
    }

}
