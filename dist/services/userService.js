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
        }
        const [rows] = yield dbConfig_1.default.query(query, [identifier]);
        const users = rows;
        if (users.length > 0) {
            return users[0];
        }
        else {
            return null;
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
        //To be returned from the function
        let finalUser;
        connection = yield dbConfig_1.default.getConnection();
        yield connection.beginTransaction();
        // Step 1: Query to find users matching email or phone number
        let query = "SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?";
        const [rows] = yield connection.query(query, [email, phoneNumber]);
        const users = rows;
        // Step 2: Handle different scenarios based on query results
        if (users.length > 0) {
            //if there is an exact record match
            users.find((user) => {
                if (user.email == email && user.phoneNumber == phoneNumber) {
                    finalUser = user;
                }
            });
            //if no exact match
            if (finalUser === undefined) {
                let primaryCount = 0;
                users.map((user) => {
                    if ((user.email == email || user.phoneNumber == phoneNumber) &&
                        user.linkPrecedence == "primary") {
                        primaryCount++;
                    }
                });
                if (primaryCount == 1) {
                    //add new record to the list
                    if (users[0].linkPrecedence == "secondary") {
                        yield connection.query("INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)", [phoneNumber, email, users[0].linkedId]);
                    }
                    else if (users[0].linkPrecedence == "primary") {
                        yield connection.query("INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)", [phoneNumber, email, users[0].id]);
                    }
                    finalUser = users[0];
                    // Handle multiple primary users scenario
                }
                else if (primaryCount > 1) {
                    // Set latest 'primary' user to 'secondary'
                    const primaryUsers = users.filter((user) => user.linkPrecedence == "primary");
                    let latestPrimaryUser = primaryUsers.reduce((prev, current) => prev.createdAt > current.createdAt ? prev : current);
                    yield connection.query("UPDATE contacts SET linkPrecedence = 'secondary' , linkedId=? WHERE id = ?", [users[0].id, latestPrimaryUser.id]);
                    finalUser = users[0];
                }
            }
        }
        else {
            // Insert new user with linkPrecedence as 'primary'
            const result = yield connection.query("INSERT INTO contacts (phoneNumber, email, linkPrecedence) VALUES (?, ?, 'primary')", [phoneNumber, email]);
            finalUser = {
                id: result[0].insertId,
                phoneNumber: phoneNumber,
                email: email,
                linkedId: "",
                linkPrecedence: "primary",
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                deletedAt: undefined,
            };
        }
        // Commit transaction if all queries succeed
        yield connection.commit();
        return finalUser;
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
        let query = "SELECT * FROM contacts WHERE linkedId = ? OR id=? ";
        const [result] = yield connection.query(query, [id, id]);
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
