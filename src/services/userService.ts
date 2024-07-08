import pool from "../config/dbConfig";
import { User } from "../models/index";
type IdentifierType = "email" | "phoneNumber";

export const getUserByOneParam = async (
  identifier: string,
  type: IdentifierType
): Promise<User | null> => {
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
    const [rows] = await pool.query(query, [identifier]);
    const users = rows as User[];
    if (users.length > 0) {
      return users[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in getUserByOneParam:", error);
    throw new Error("An error occurred while fetching user");
  }
};
export const getUserByBothParam = async (
  email: string,
  phoneNumber: string
): Promise<User | undefined> => {
  let connection;
  try {
    //To be returned from the function
    let finalUser: User | undefined;
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // Step 1: Query to find users matching email or phone number
    let query = "SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?";
    const [rows] = await connection.query(query, [email, phoneNumber]);
    const users = rows as User[];
    // Step 2: Handle different scenarios based on query results
    if (users.length > 0) {
      //if there is an exact record match
      users.find((user: User) => {
        if (user.email == email && user.phoneNumber == phoneNumber) {
          finalUser = user;
        }
      });
      //if no exact match
      if (finalUser === undefined) {
        let primaryCount: number = 0;
        users.map((user: User) => {
          if (
            (user.email == email || user.phoneNumber == phoneNumber) &&
            user.linkPrecedence == "primary"
          ) {
            primaryCount++;
          }
        });
        if (primaryCount == 1) {
          //add new record to the list
          if (users[0].linkPrecedence == "secondary") {
            await connection.query(
              "INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)",
              [phoneNumber, email, users[0].linkedId]
            );
          } else if (users[0].linkPrecedence == "primary") {
            await connection.query(
              "INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)",
              [phoneNumber, email, users[0].id]
            );
          }
          finalUser = users[0];
          // Handle multiple primary users scenario
        } else if (primaryCount > 1) {
          // Set latest 'primary' user to 'secondary'
          const primaryUsers = users.filter(
            (user) => user.linkPrecedence == "primary"
          );
          let latestPrimaryUser = primaryUsers.reduce((prev, current) =>
            prev.createdAt > current.createdAt ? prev : current
          );
          await connection.query(
            "UPDATE contacts SET linkPrecedence = 'secondary' , linkedId=? WHERE id = ?",
            [users[0].id, latestPrimaryUser.id]
          );
          finalUser = users[0];
        }
      }
    } else {
      // Insert new user with linkPrecedence as 'primary'
      const result: any = await connection.query(
        "INSERT INTO contacts (phoneNumber, email, linkPrecedence) VALUES (?, ?, 'primary')",
        [phoneNumber, email]
      );
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
    await connection.commit();
    return finalUser;
  } catch (error) {
    // Rollback transaction if any query fails
    if (connection) {
      await connection.rollback();
    }
    console.error("Error in getUserByBothParam:", error);
    throw new Error("An error occurred while processing the request");
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
};
export const getUsersByLinkedId = async (id: string): Promise<User[]> => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    let query = "SELECT * FROM contacts WHERE linkedId = ? OR id=? ";
    const [result] = await connection.query(query, [id, id]);
    const users = result as User[];
    return users;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error in getUserByBothParam:", error);
    throw new Error("An error occurred while processing the request");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
