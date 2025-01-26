/** livedb holds a data in the process, 
 * livedb is key-value db
 * manage thier expiration and syncs it with other processes using cortex 
 * users of the live db can subscribe to specific collection and 
 * the listener will be triggered if an item is added to the collection 
 * newly added documents is populated over cortex 
 * Do Not use it for high write inputs
 * Do Not use for large data sets 
 * ideal for 
 * - sharing configurations 
 * the db is held in process memory, so don't use for large data sets 
 * */

const Redis = require('ioredis');
const { EventEmitter } = require('events');

module.exports = class LiveDB extends EventEmitter {
    constructor({config, cache}) {
        super();
        this.config = config;
        this.cache = cache;
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 2000;

        this.setupRedisConnection();
    }

    setupRedisConnection() {
        // Create a new Redis connection for streams
        this.redis = new Redis(this.config.dotEnv.REDIS_URI, {
            retryStrategy: (times) => {
                if (times > this.maxRetries) {
                    console.error('Max Redis retry attempts reached');
                    return null; // Stop retrying
                }
                const delay = Math.min(times * this.retryDelay, 10000);
                console.log(`Retrying Redis connection in ${delay}ms... (Attempt ${times})`);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            reconnectOnError: (err) => {
                console.error('Redis reconnect on error:', err);
                return true;
            }
        });

        // Redis event handlers
        this.redis.on('connect', () => {
            console.log('LiveDB Redis connected');
            this.isConnected = true;
            this.retryAttempts = 0;
            this.emit('connected');
        });

        this.redis.on('error', (error) => {
            console.error('LiveDB Redis error:', error);
            this.isConnected = false;
            this.emit('error', error);
        });

        this.redis.on('close', () => {
            console.log('LiveDB Redis connection closed');
            this.isConnected = false;
            this.emit('disconnected');
        });

        this.redis.on('reconnecting', () => {
            console.log('LiveDB Redis reconnecting...');
            this.retryAttempts++;
        });

        // Handle process termination
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }

    async cleanup() {
        try {
            if (this.redis) {
                console.log('Closing LiveDB Redis connection...');
                await this.redis.quit();
                this.isConnected = false;
                console.log('LiveDB Redis connection closed gracefully');
            }
        } catch (error) {
            console.error('Error closing LiveDB Redis connection:', error);
        }
    }

    async reconnect() {
        if (!this.isConnected && this.retryAttempts < this.maxRetries) {
            console.log('Attempting to reconnect LiveDB Redis...');
            this.setupRedisConnection();
        }
    }

    /** sub to other nodes */
    _sub(){
        this.cortex.sub('internal.liveDb.add', (d)=>{
            this.add({collection: d.collection, key: d.key, value: d.value, exp: d.exp, pub: false});
        });
    }

    /** publish to other nodes */
    _pub({action, payload}){
        this.cortex.AsyncEmitToAllOf({type: this.cortex.nodeType, call: `internal.liveDb.${action}`, args: payload})
    }

    db(collection){
        return {
            add: ({key, value, exp})=>{ return this.add({collection, key, value, exp, pub: true}) },
            delete: ({key})=>{ return this.delete({collection, key}) },
            get: ({key})=>{ return this.get({collection, key}) },
        }
    }


    add({collection, key, value, exp=-1, pub=false}){
        if(!this.store[collection])this.store[collection]={};
        const doc = this.store[collection][key] = {value, exp};
        if(pub)this._pub({action: 'add', payload: {collection, key, value, exp}});
        
        return doc;
    }

    /** get or null */
    get({collection, key}){
        let exCol = this.store[collection] || {};
        return exCol[key] || null;
    }

    delete({collection, key}){
        let exCol = this.store[collection] || {};
        this.delete(exCol[key]);
    }

    handleStreamError(error) {
        console.error('Stream error:', error);
        if (error.code === 'ERR_IPC_CHANNEL_CLOSED') {
            console.log('IPC channel closed, attempting to reconnect...');
            this.reconnect();
        }
    }

    // Wrap your stream operations with error handling
    async streamOperation(operation) {
        try {
            if (!this.isConnected) {
                await this.reconnect();
            }
            return await operation();
        } catch (error) {
            this.handleStreamError(error);
            throw error;
        }
    }
}