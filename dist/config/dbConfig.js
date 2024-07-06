"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = require("mysql2/promise");
const pool = (0, promise_1.createPool)({
    host: "localhost",
    user: "",
    password: "",
    database: "Bitespeed",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
function createTable() {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            connection = yield pool.getConnection();
            yield connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(100),
        linkedId INT,
        linkPrecedence ENUM ('secondary', 'primary') DEFAULT 'primary',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        UNIQUE (phoneNumber, email,linkPrecedence)
      )
    `);
            console.log("Table created successfully!");
        }
        catch (err) {
            console.error("Error creating table:", err);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    });
}
createTable();
exports.default = pool;
