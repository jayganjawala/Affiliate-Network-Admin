const express = require('express');

module.exports = (req, res, next) => {
    express.json()(req, res, (err) => {
        if (err) {
            console.error('JSON parsing error:', err);
            return res.status(400).json({ status: false, error: 'Invalid JSON' });
        }
        next();
    });
};