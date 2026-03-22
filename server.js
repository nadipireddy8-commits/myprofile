const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Database connection (will work when you add database)
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "#310308",
    database: process.env.DB_NAME || "profiledb"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection error:", err.message);
    } else {
        console.log("Successfully connected to database");
        
        // Create table if not exists
        const createTable = `
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        db.query(createTable, (err) => {
            if (err) console.log("Table creation error:", err);
            else console.log("Contacts table ready");
        });
    }
});

// Contact form endpoint
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    console.log("Received contact form:", { name, email, message });
    
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            error: "All fields are required" 
        });
    }
    
    const sql = "INSERT INTO contacts(name, email, message) VALUES(?,?,?)";
    
    db.query(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ 
                success: false, 
                error: "Database error occurred" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Message sent successfully!" 
        });
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});