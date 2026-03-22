require('dotenv').config();

console.log("=== Environment Variables ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("==============================");

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.log("❌ Connection failed:", err.message);
        console.log("\n💡 Troubleshooting tips:");
        console.log("1. Make sure MySQL is installed");
        console.log("2. Check if MySQL service is running");
        console.log("3. Verify password in .env file is correct");
        console.log("4. Try password without special characters");
    } else {
        console.log("✅ Connected successfully!");
        connection.end();
    }
});