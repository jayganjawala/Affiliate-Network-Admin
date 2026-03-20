const express = require('express');
const mysql = require('mysql2');
const util = require('util');
require('dotenv').config();
const jsonMiddleware = require('./middleware/jsonMiddleware');
const authMiddleware = require('./middleware/authMiddleware')
const adminRoutes = require('./routes/adminRoutes')
const myProfile = require('./routes/myProfile')
const users = require('./routes/users')
const payments = require('./routes/payments')
const employees = require('./routes/employees')
const supports = require('./routes/support')
const roles = require('./routes/roles')
const permissions = require('./routes/permissions')
const leadhistory = require('./routes/leadhistory')
const services = require('./routes/services')
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.query = util.promisify(db.query);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware
app.use(cors());
app.use(jsonMiddleware);

// Debug middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

app.use('/api', adminRoutes(db));

app.use('/api', authMiddleware(db), myProfile(db));
app.use('/api', authMiddleware(db), users(db))
app.use('/api', authMiddleware(db), payments(db))
app.use('/api', authMiddleware(db), employees(db))
app.use('/api', authMiddleware(db), supports(db))
app.use('/api', authMiddleware(db), roles(db))
app.use('/api', authMiddleware(db), permissions(db))
app.use('/api', authMiddleware(db), leadhistory(db))
app.use('/api', authMiddleware(db), services(db))

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});