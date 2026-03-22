const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config(); // This loads your .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration
// Use Render's DATABASE_URL if available, otherwise use local MySQL
let pool = null;
let dbType = 'none';

// Check if we're using PostgreSQL (Render) or MySQL (local)
if (process.env.DATABASE_URL) {
    // Using PostgreSQL on Render
    console.log("✅ Using PostgreSQL database (Render)");
    dbType = 'postgresql';
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    // Test PostgreSQL connection
    pool.connect((err, client, release) => {
        if (err) {
            console.error("❌ PostgreSQL connection error:", err.message);
            dbType = 'none';
        } else {
            console.log("✅ Connected to PostgreSQL database!");
            release();
            
            // Create table
            pool.query(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `).then(() => {
                console.log("✅ Contacts table ready");
            }).catch(err => {
                console.log("❌ Table creation error:", err.message);
            });
        }
    });
} else if (process.env.DB_HOST) {
    // Using MySQL locally
    console.log("✅ Using MySQL database (Local)");
    dbType = 'mysql';
    const mysql = require('mysql2');
    pool = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });
    
    pool.connect((err) => {
        if (err) {
            console.error("❌ MySQL connection error:", err.message);
            dbType = 'none';
        } else {
            console.log("✅ Connected to MySQL database!");
            
            // Create table
            const createTable = `
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            pool.query(createTable, (err) => {
                if (err) console.log("❌ Table creation error:", err);
                else console.log("✅ Contacts table ready");
            });
        }
    });
} else {
    console.log("⚠️  No database configured - running without database");
    console.log("📝 Contact form will work but messages won't be saved");
}

// Contact form endpoint
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    console.log("📨 Message received:", { name, email, message });
    
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            error: "All fields are required" 
        });
    }
    
    if (!pool || dbType === 'none') {
        console.log("💾 No database - message not saved");
        return res.json({ 
            success: true, 
            message: "Message received! (Database not available)" 
        });
    }
    
    try {
        if (dbType === 'postgresql') {
            // PostgreSQL query
            const result = await pool.query(
                'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id',
                [name, email, message]
            );
            console.log("✅ Message saved! ID:", result.rows[0].id);
        } else {
            // MySQL query
            pool.query(
                'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
                [name, email, message],
                (err, result) => {
                    if (err) throw err;
                    console.log("✅ Message saved! ID:", result.insertId);
                }
            );
        }
        
        res.json({ 
            success: true, 
            message: "Thank you! Your message has been saved." 
        });
    } catch (err) {
        console.error("❌ Database error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Database error: " + err.message 
        });
    }
});

// Admin endpoint to view messages
app.get('/admin/messages', async (req, res) => {
    if (!pool || dbType === 'none') {
        return res.json({ 
            message: "Database not available",
            messages: [] 
        });
    }
    
    try {
        if (dbType === 'postgresql') {
            const result = await pool.query(
                'SELECT * FROM contacts ORDER BY created_at DESC'
            );
            res.json(result.rows);
        } else {
            pool.query(
                'SELECT * FROM contacts ORDER BY created_at DESC',
                (err, results) => {
                    if (err) throw err;
                    res.json(results);
                }
            );
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log(`📊 Database type: ${dbType}`);
});