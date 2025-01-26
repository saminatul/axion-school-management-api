module.exports = {
    SERVICE_NAME: process.env.SERVICE_NAME,
    ENV: process.env.ENV,
    CORTEX_REDIS: process.env.CORTEX_REDIS,
    CORTEX_PREFIX: process.env.CORTEX_PREFIX,
    CORTEX_TYPE: process.env.CORTEX_TYPE,
    OYSTER_REDIS: process.env.OYSTER_REDIS,
    OYSTER_PREFIX: process.env.OYSTER_PREFIX,
    CACHE_REDIS: process.env.CACHE_REDIS,
    CACHE_PREFIX: process.env.CACHE_PREFIX,
    MONGO_URI: process.env.MONGO_URI,
    USER_PORT: process.env.USER_PORT,
    ADMIN_PORT: process.env.ADMIN_PORT,
    ADMIN_URL: process.env.ADMIN_URL,
    LONG_TOKEN_SECRET: process.env.LONG_TOKEN_SECRET,
    SHORT_TOKEN_SECRET: process.env.SHORT_TOKEN_SECRET,
    NACL_SECRET: process.env.NACL_SECRET
}