module.exports = {
    __auth: async function({req, managers}) {
        try {
            // Check if token manager exists
            if (!managers || !managers.token) {
                console.error('Token manager not found in auth middleware');
                return {
                    error: 'Authentication service unavailable',
                    status: 500
                };
            }

            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return {
                    error: 'Authentication required',
                    status: 401
                };
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return {
                    error: 'Invalid token format',
                    status: 401
                };
            }

            console.log('Verifying token:', token);
            const decoded = await managers.token.verifyShortToken({ token });
            console.log('Decoded token:', decoded);

            if (!decoded) {
                return {
                    error: 'Invalid or expired token',
                    status: 401
                };
            }

            // Return user info to be used in subsequent middleware or handlers
            return {
                user: {
                    userId: decoded.userId,
                    userKey: decoded.userKey,
                    role: decoded.role
                }
            };
        } catch (error) {
            console.error('Auth middleware error:', error);
            return {
                error: 'Authentication failed',
                status: 401
            };
        }
    },

    __superadminOnly: async function({req, managers, results}) {
        if (!results.user || results.user.role !== 'superadmin') {
            return {
                error: 'Unauthorized: Superadmin access required',
                status: 403
            };
        }
        return true;
    },

    __schoolAdminOnly: async function({req, managers, results}) {
        if (!results.user || !['superadmin', 'school_admin'].includes(results.user.role)) {
            return {
                error: 'Unauthorized: School admin access required',
                status: 403
            };
        }
        return true;
    }
}; 