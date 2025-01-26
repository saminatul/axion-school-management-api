const MiddlewaresLoader     = require('./MiddlewaresLoader');
const ApiHandler            = require("../managers/api/Api.manager");
const LiveDB                = require('../managers/live_db/LiveDb.manager');
const UserServer            = require('../managers/http/UserServer.manager');
const ResponseDispatcher    = require('../managers/response_dispatcher/ResponseDispatcher.manager');
const VirtualStack          = require('../managers/virtual_stack/VirtualStack.manager');
const ValidatorsLoader      = require('./ValidatorsLoader');
const ResourceMeshLoader    = require('./ResourceMeshLoader');
const utils                 = require('../libs/utils');
const MongoManager          = require('../managers/db/Mongo.manager');
const Redis                 = require('ioredis');

const systemArch            = require('../static_arch/main.system');
const TokenManager          = require('../managers/token/Token.manager');
const SharkFin              = require('../managers/shark_fin/SharkFin.manager');
const TimeMachine           = require('../managers/time_machine/TimeMachine.manager');
const UserManager           = require('../managers/entities/user/User.manager');
const SchoolManager         = require('../managers/entities/school/School.manager');

/** 
 * load sharable modules
 * @return modules tree with instance of each module
*/
module.exports = class ManagersLoader {
    constructor({ config, cortex, cache, oyster, aeon }) {
        this.managers   = {};
        this.config     = config;
        this.cache      = cache;
        this.cortex     = cortex;
        
        // Initialize Redis with better error handling
        this.redis = new Redis(this.config.dotEnv.REDIS_URI, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                console.log(`Retrying Redis connection in ${delay}ms...`);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            reconnectOnError: (err) => {
                console.error('Redis reconnect on error:', err);
                return true;
            }
        });

        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        this.redis.on('connect', () => {
            console.log('Redis connected successfully');
        });

        this.redis.on('close', () => {
            console.log('Redis connection closed');
        });

        this.redis.on('reconnecting', () => {
            console.log('Redis reconnecting...');
        });

        process.on('SIGINT', () => {
            this.cleanup().then(() => process.exit(0));
        });

        process.on('SIGTERM', () => {
            this.cleanup().then(() => process.exit(0));
        });

        this._preload();
        this.injectable = {
            utils,
            cache, 
            config,
            cortex,
            oyster,
            aeon,
            redis: this.redis,
            managers: this.managers, 
            validators: this.validators,
            resourceNodes: this.resourceNodes,
        };
    }

    async cleanup() {
        console.log('Cleaning up connections...');
        if (this.redis) {
            try {
                await this.redis.quit();
                console.log('Redis connection closed gracefully');
            } catch (error) {
                console.error('Error closing Redis connection:', error);
            }
        }
        if (this.managers.liveDb) {
            await this.managers.liveDb.cleanup();
        }
    }

    _preload(){
        const validatorsLoader    = new ValidatorsLoader({
            models: require('../managers/_common/schema.models'),
            customValidators: require('../managers/_common/schema.validators'),
        });
        const resourceMeshLoader  = new ResourceMeshLoader({})
        // const mongoLoader      = new MongoLoader({ schemaExtension: "mongoModel.js" });

        this.validators           = validatorsLoader.load();
        this.resourceNodes        = resourceMeshLoader.load();
        // this.mongomodels          = mongoLoader.load();

    }

    load() {
        // Initialize core managers first
        this.managers.responseDispatcher = new ResponseDispatcher();
        this.managers.token = new TokenManager(this.injectable);
        this.managers.liveDb = new LiveDB(this.injectable);
        
        // Initialize middleware loader with updated injectable
        const middlewaresLoader = new MiddlewaresLoader({
            ...this.injectable,
            managers: this.managers // Pass the initialized managers
        });
        
        const mwsRepo = middlewaresLoader.load();
        const { layers, actions } = systemArch;
        this.injectable.mwsRepo = mwsRepo;

        // Register auth middleware with access to managers
        this.injectable.mwsRepo.__auth = async (params) => {
            return require('../managers/middlewares/auth.middleware').__auth({
                ...params,
                managers: this.managers
            });
        };

        /*****************************************CUSTOM MANAGERS*****************************************/
        this.managers.shark = new SharkFin({ ...this.injectable, layers, actions });
        this.managers.timeMachine = new TimeMachine(this.injectable);
        this.managers.user = new UserManager(this.injectable);
        this.managers.mongo = new MongoManager(this.injectable);
        this.managers.school = new SchoolManager(this.injectable);
        /*************************************************************************************************/
        
        this.managers.mwsExec = new VirtualStack({ 
            ...{ preStack: [/* '__token', */'__device'] }, 
            ...this.injectable 
        });
        
        this.managers.userApi = new ApiHandler({
            ...this.injectable,
            prop: 'httpExposed'
        });
        
        this.managers.userServer = new UserServer({ 
            config: this.config, 
            managers: this.managers 
        });

        return this.managers;
    }

}

