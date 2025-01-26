const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const app               = express();

module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
        this.mongo         = managers.mongo;
        this.redis         = managers.redis;
        this.liveDb        = managers.liveDb;

        // Handle LiveDB events
        this.liveDb.on('error', this.handleLiveDBError.bind(this));
    }
    
    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    async run(){
        // Error handling for uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
            if (err.code === 'ERR_IPC_CHANNEL_CLOSED') {
                console.log('IPC channel closed, attempting to reconnect...');
                this.liveDb.reconnect();
            }
        });

        // Error handling for unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Connect to MongoDB before starting the server
        try {
            await this.mongo.connect();
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }

        // Graceful shutdown handler
        const gracefulShutdown = async () => {
            console.log('Received shutdown signal');
            
            // Close server first
            await new Promise((resolve) => {
                server.close(() => {
                    console.log('Server closed');
                    resolve();
                });
            });

            // Cleanup connections
            if (this.mongo.isConnected) {
                await this.mongo.disconnect();
            }

            process.exit(0);
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        /** an error handler */
        app.use((err, req, res, next) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        });
        
        /** a single middleware to handle all */
        app.all('/api/:moduleName/:fnName', this.userApi.mw);

        let server = http.createServer(app);
        
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }

    handleLiveDBError(error) {
        console.error('LiveDB error in UserServer:', error);
        if (error.code === 'ERR_IPC_CHANNEL_CLOSED') {
            console.log('Attempting to reconnect LiveDB...');
            this.liveDb.reconnect();
        }
    }
}