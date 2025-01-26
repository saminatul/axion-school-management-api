const jwt        = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const md5        = require('md5');


module.exports = class TokenManager {

    constructor({config}){
        this.config              = config;
        this.longTokenExpiresIn  = '3y';
        this.shortTokenExpiresIn = '1y';

        this.httpExposed         = ['v1_createShortToken'];
    }

    /** 
     * short token are issue from long token 
     * short tokens are issued for 72 hours 
     * short tokens are connected to user-agent
     * short token are used on the soft logout 
     * short tokens are used for account switch 
     * short token represents a device. 
     * long token represents a single user. 
     *  
     * long token contains immutable data and long lived
     * master key must exists on any device to create short tokens
     */
    genLongToken({userId, userKey, role}){
        return jwt.sign(
            { 
                userKey, 
                userId,
                role,
            }, 
            this.config.dotEnv.LONG_TOKEN_SECRET, 
            {expiresIn: this.longTokenExpiresIn
        })
    }

    genShortToken({userId, userKey, sessionId, deviceId, role}){
        return jwt.sign(
            { userKey, userId, sessionId, deviceId, role}, 
            this.config.dotEnv.SHORT_TOKEN_SECRET, 
            {expiresIn: this.shortTokenExpiresIn
        })
    }

    _verifyToken({token, secret}){
        try {
            return jwt.verify(token, secret);
        } catch(err) {
            console.log('Token verification error:', err.message);
            return null;
        }
    }

    verifyLongToken({token}){
        return this._verifyToken({
            token, 
            secret: this.config.dotEnv.LONG_TOKEN_SECRET
        });
    }
    verifyShortToken({token}){
        console.log('Verifying short token:', token);
        const result = this._verifyToken({
            token, 
            secret: this.config.dotEnv.SHORT_TOKEN_SECRET
        });
        console.log('Verification result:', result);
        return result;
    }


    /** generate shortId based on a longId */
    async v1_createShortToken({__headers, __device}) {
        console.log('Headers received:', __headers);
        
        const token = __headers.authorization?.split(' ')[1];
        if (!token) {
            console.log('No token found in headers');
            return { error: 'Token required' };
        }
        
        console.log('Processing token:', token);
        
        let decoded = this.verifyLongToken({ token });
        if (!decoded) {
            console.log('Token verification failed');
            return { error: 'Invalid token' };
        }
        
        console.log('Decoded token:', decoded);
        
        let shortToken = this.genShortToken({
            userId: decoded.userId,
            userKey: decoded.userKey,
            sessionId: nanoid(),
            deviceId: md5(__device),
            role: decoded.role
        });

        return { shortToken };
    }
}