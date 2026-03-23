const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP 
    message: {
        status: 429,
        message: 'Too many requests from this IP, please try again later.'
    }
});

module.exports = apiLimiter;