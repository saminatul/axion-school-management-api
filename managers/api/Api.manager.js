const getParamNames = require('./_common/getParamNames');
/** 
 * scans all managers for exposed methods 
 * and makes them available through a handler middleware
 */

module.exports = class ApiHandler {

    /**
     * @param {object} containing instance of all managers
     * @param {string} prop with key to scan for exposed methods
     */

    constructor({config, cortex, cache, managers, mwsRepo, prop}){
        this.config        = config;
        this.cache         = cache; 
        this.cortex        = cortex;
        this.managers      = managers;
        this.mwsRepo       = mwsRepo;
        this.mwsExec       = this.managers.mwsExec;
        this.prop          = prop
        this.exposed       = {};
        this.methodMatrix  = {};
        this.auth          = {};
        this.fileUpload    = {};
        this.mwsStack        = {};
        this.mw            = this.mw.bind(this);

        /** filter only the modules that have interceptors */
        // console.log(`# Http API`);
        Object.keys(this.managers).forEach(mk=>{
            if(this.managers[mk][this.prop]){
                // console.log('managers - mk ', this.managers[mk])
                this.methodMatrix[mk] = {
                    post: [],
                    get: [],
                    put: [],
                    delete: []
                };
                // console.log(`## ${mk}`);
                const exposed = this.managers[mk][this.prop];
                
                // Handle both array and object formats
                if (Array.isArray(exposed)) {
                    // Legacy array format - all methods are POST
                    exposed.forEach(exp => {
                        let mwStack = [];
                        let fnName = exp;

                        if(exp.includes('=')){
                            let parts = exp.split('=');
                            fnName = parts.pop();
                            mwStack = parts;
                        }

                        this.methodMatrix[mk].post.push(fnName);
                        this.mwsStack[`${mk}.${fnName}`] = mwStack;
                    });
                } else {
                    // New object format with HTTP methods
                    Object.entries(exposed).forEach(([method, endpoints]) => {
                        endpoints.forEach(exp => {
                            let mwStack = [];
                            let fnName = exp;

                            if(exp.includes('=')){
                                let parts = exp.split('=');
                                fnName = parts.pop();
                                mwStack = parts;
                            }

                            this.methodMatrix[mk][method].push(fnName);
                            this.mwsStack[`${mk}.${fnName}`] = mwStack;
                        });
                    });
                }

                // Log the method matrix for debugging
                console.log(`Method matrix for ${mk}:`, this.methodMatrix[mk]);
            }
        });

        /** expose apis through cortex */
        Object.keys(this.managers).forEach(mk=>{
            if(this.managers[mk].interceptor){
                this.exposed[mk]=this.managers[mk];
                // console.log(`## ${mk}`);
                if(this.exposed[mk].cortexExposed){
                    this.exposed[mk].cortexExposed.forEach(i=>{
                        // console.log(`* ${i} :`,getParamNames(this.exposed[mk][i]));
                    })
                }
            }
        });

        /** expose apis through cortex */
        this.cortex.sub('*', (d, meta, cb) => {
            let [moduleName, fnName] = meta.event.split('.');
            let targetModule = this.exposed[moduleName];
            if (!targetModule) return cb({ error: `module ${moduleName} not found` });
            try {
                targetModule.interceptor({ data: d, meta, cb, fnName });
            } catch (err) {
                cb({ error: `failed to execute ${fnName}` });
            }
        });
        
    }


    async _exec({targetModule, fnName, cb, data}){
        let result = {};
        
            try {
                result = await targetModule[`${fnName}`](data);
            } catch (err){
                console.log(`error`, err);
                result.error = `${fnName} failed to execute`;
            }
    
        if(cb)cb(result);
        return result;
    }

     /** a middle for executing admin apis trough HTTP */
    async mw(req, res, next){
        let method = req.method.toLowerCase();
        let moduleName = req.params.moduleName;
        let fnName = req.params.fnName;

        console.log('API Request:', {
            method,
            moduleName,
            fnName,
            url: req.url,
            body: req.body
        });

        let moduleMatrix = this.methodMatrix[moduleName];

        /** validate module */
        if (!moduleMatrix) {
            console.log(`Module ${moduleName} not found in method matrix`);
            return this.managers.responseDispatcher.dispatch(res, { 
                ok: false, 
                message: `module ${moduleName} not found` 
            });
        }

        /** validate method */
        if (!moduleMatrix[method]) {
            console.log(`Method ${method} not supported for module ${moduleName}`);
            return this.managers.responseDispatcher.dispatch(res, { 
                ok: false, 
                message: `unsupported method ${method} for ${moduleName}` 
            });
        }

        console.log(`Available functions for ${moduleName}.${method}:`, moduleMatrix[method]);

        if (!moduleMatrix[method].includes(fnName)) {
            console.log(`Function ${fnName} not found in ${moduleName}.${method}`);
            return this.managers.responseDispatcher.dispatch(res, { 
                ok: false, 
                message: `unable to find function ${fnName} with method ${method}` 
            });
        }

        // console.log(`${moduleName}.${fnName}`);

        let targetStack = this.mwsStack[`${moduleName}.${fnName}`];

        let hotBolt = this.mwsExec.createBolt({
            stack: targetStack,
            req,
            res,
            onDone: async ({ req, res, results }) => {
                /** executed after all middleware finished */
                let body = req.body || {};
                let result = await this._exec({
                    targetModule: this.managers[moduleName],
                    fnName,
                    data: {
                        ...body,
                        ...results,
                        __headers: req.headers,
                        res,
                    }
                });

                if (!result) result = {};

                if (result.selfHandleResponse) {
                    // do nothing if response handled
                } else {
                    if (result.errors) {
                        return this.managers.responseDispatcher.dispatch(res, { ok: false, errors: result.errors });
                    } else if (result.error) {
                        return this.managers.responseDispatcher.dispatch(res, { ok: false, message: result.error });
                    } else {
                        return this.managers.responseDispatcher.dispatch(res, { ok: true, data: result });
                    }
                }
            }
        });
        hotBolt.run();    
        
    }
}