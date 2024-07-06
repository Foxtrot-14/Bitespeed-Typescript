import pool from "../config/dbConfig";
import { User } from "../models/index";

type IdentifierType = "email" | "phoneNumber";

export const getUserByOneParam = async (
  identifier: string,
  type: IdentifierType
): Promise<{ user?: User; message?: string }> => {
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
    const [rows] = await pool.query(query, [identifier]);
    const users = rows as User[];
    if (users.length > 0) {
      return { user: users[0] };
    } else {
      return { message: "User not found" };
    }
  } catch (error) {
    console.error("Error in getUserByOneParam:", error);
    throw new Error("An error occurred while fetching user");
  }
};
export const getUserByBothParam = async (
  email: string,
  phoneNumber: string
): Promise<User> => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    let query = "SELECT * FROM contacts WHERE email = ? AND phoneNumber = ?";
    const [result] = await connection.query(query, [email, phoneNumber]);
    const user = result as User[];
    if (user.length != 0) {
      return user[0];
    } else {
      // Step 1: Query to find users matching email or phone number
      query = "SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?";
      const [rows] = await connection.query(query, [email, phoneNumber]);
      const users = rows as User[];
      // Step 2: Handle different scenarios based on query results
      if (users.length > 0) {
        //what if it matches a user that is secondary. Insert with the same linkedId
        if (users[0].linkPrecedence === "secondary") {
          await connection.query(
            "INSERT INTO contacts (phoneNumber, email, linkPrecedence,linkedId) VALUES (?, ?, 'secondary',?)",
            [phoneNumber, email, users[0].linkedId]
          );
        }
        // Handle multiple primary users scenario
        const primaryUsers = users.filter(
          (user) => user.linkPrecedence === "primary"
        );
        if (primaryUsers.length >= 2) {
          // Set latest 'primary' user to 'secondary'
          let latestPrimaryUser = primaryUsers.reduce((prev, current) =>
            prev.createdAt > current.createdAt ? prev : current
          );
          await connection.query(
            "UPDATE contacts SET linkPrecedence = 'secondary' , linkedId=? WHERE id = ?",
            [users[0].id, latestPrimaryUser.id]
          );
        } else if (primaryUsers.length === 1) {
          // Insert new user with linkPrecedence as 'secondary'
          const primaryUser = primaryUsers[0];
          await connection.query(
            "INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ?, 'secondary')",
            [phoneNumber, email, primaryUser.id]
          );
        }
      } else {
        // Insert new user with linkPrecedence as 'primary'
        await connection.query(
          "INSERT INTO contacts (phoneNumber, email, linkPrecedence) VALUES (?, ?, 'primary')",
          [phoneNumber, email]
        );
        await connection.commit();
        const [result] = await connection.query(
          "SELECT * FROM contacts WHERE phoneNumber = ? AND email = ?",
          [phoneNumber, email]
        );
        const user = result as User[];
        return user[0];
      }
    }
    // Commit transaction if all queries succeed
    await connection.commit();

    // Fetch all users again after updating
    query = `SELECT * FROM contacts WHERE id IN (SELECT linkedId FROM contacts WHERE email = ? AND phoneNumber = ?);`;
    const [updatedRows] = await connection.query(query, [email, phoneNumber]);
    const updatedUsers = updatedRows as User[];

    // Return the updated list of users
    return updatedUsers[0];
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
    let query = "SELECT * FROM contacts WHERE linkedId = ? ";
    const [result] = await connection.query(query, [id]);
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
