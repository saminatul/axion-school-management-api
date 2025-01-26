const mongoose = require('mongoose');

module.exports = class MongoManager {
    constructor({config}) {
        this.config = config;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) return;

            console.log('Connecting to MongoDB...', this.config.dotEnv.MONGO_URI);
            await mongoose.connect(this.config.dotEnv.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            this.isConnected = true;
            console.log('MongoDB Connected Successfully');

            // Test the connection
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));

            // Handle connection errors
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });

        } catch (error) {
            console.error('MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) return;
        
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('MongoDB Disconnected');
    }
} 