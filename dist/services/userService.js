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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersByLinkedId = exports.getUserByBothParam = exports.getUserByOneParam = void 0;
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const getUserByOneParam = (identifier, type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = "";
        switch (type) {
            case "email":
                query = "SELECT * FROM contacts WHERE email = ?";
                break;
            case "phoneNumber":
                query = "SELECT * FROM contacts WHERE phoneNumber = ?";
                break;
            default:
                return { message: "Invalid identifier type" };
        }
        const [rows] = yield dbConfig_1.default.query(query, [identifier]);
        const users = rows;
        if (users.length > 0) {
            return { user: users[0] };
        }
        else {
            return { message: "User not found" };
        }
    }
    catch (error) {
        console.error("Error in getUserByOneParam:", error);
        throw new Error("An error occurred while fetching user");
    }
});
exports.getUserByOneParam = getUserByOneParam;
const getUserByBothParam = (email, phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    let connection;
    try {
        connection = yield dbConfig_1.default.getConnection();
        yield connection.beginTransaction();
        let query = "SELECT * FROM contacts WHERE email = ? AND phoneNumber = ?";
        const [result] = yield connection.query(query, [email, phoneNumber]);
        const user = result;
        if (user.length != 0) {
            return user[0];
        }
        else {
            // Step 1: Query to find users matching email or phone number
            query = "SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?";
            const [rows] = yield connection.query(query, [email, phoneNumber]);
            const users = rows;
            // Step 2: Handle different scenarios based on query results
            if (users.length > 0) {
                //what if it matches a user that is secondary. Insert with the same linkedId
                if (users[0].linkPrecedence === "secondary") {
                    yield connection.query("INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)", [phoneNumber, email, users[0].linkedId]);
                }
                // Handle multiple primary users scenario
                const primaryUsers = users.filter((user) => user.linkPrecedence === "primary");
                if (primaryUsers.length >= 2) {
                    // Set latest 'primary' user to 'secondary'
                    let latestPrimaryUser = primaryUsers.reduce((prev, current) => prev.createdAt > current.createdAt ? prev : current);
                    yield connection.query("UPDATE contacts SET linkPrecedence = 'secondary' , linkedId=? WHERE id = ?", [users[0].id, latestPrimaryUser.id]);
                }
                else if (primaryUsers.length === 1) {
                    // Insert new user with linkPrecedence as 'secondary'
                    const primaryUser = primaryUsers[0];
                    yield connection.query("INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ?, 'secondary')", [phoneNumber, email, primaryUser.id]);
                }
            }
            else {
                // Insert new user with linkPrecedence as 'primary'
                yield connection.query("INSERT INTO contacts (phoneNumber, email, linkPrecedence) VALUES (?, ?, 'primary')", [phoneNumber, email]);
                yield connection.commit();
                const [result] = yield connection.query("SELECT * FROM contacts WHERE phoneNumber = ? AND email = ?", [phoneNumber, email]);
                const user = result;
                return user[0];
            }
        }
        // Commit transaction if all queries succeed
        yield connection.commit();
        // Fetch all users again after updating
        query = `SELECT * FROM contacts WHERE id IN (SELECT linkedId FROM contacts WHERE email = ? AND phoneNumber = ?);`;
        const [updatedRows] = yield connection.query(query, [email, phoneNumber]);
        const updatedUsers = updatedRows;
        // Return the updated list of users
        return updatedUsers[0];
    }
    catch (error) {
        // Rollback transaction if any query fails
        if (connection) {
            yield connection.rollback();
        }
        console.error("Error in getUserByBothParam:", error);
        throw new Error("An error occurred while processing the request");
    }
    finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});
exports.getUserByBothParam = getUserByBothParam;
const getUsersByLinkedId = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let connection;
    try {
        connection = yield dbConfig_1.default.getConnection();
        yield connection.beginTransaction();
        let query = "SELECT * FROM contacts WHERE linkedId = ? ";
        const [result] = yield connection.query(query, [id]);
        const users = result;
        return users;
    }
    catch (error) {
        if (connection) {
            yield connection.rollback();
        }
        console.error("Error in getUserByBothParam:", error);
        throw new Error("An error occurred while processing the request");
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
});
exports.getUsersByLinkedId = getUsersByLinkedId;
