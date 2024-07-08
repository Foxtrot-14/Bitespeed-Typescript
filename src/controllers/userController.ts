import { Request, Response } from "express";
import {
  getUserByBothParam,
  getUserByOneParam,
  getUsersByLinkedId,
} from "../services/userService";
import { User } from "../models/index";
interface IdentityRequest {
  email?: string;
  phoneNumber?: string;
}

export const getIdentity = async (
  req: Request<{}, {}, IdentityRequest>,
  res: Response
) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).send("Email or phone number is required");
    }

    let result;

    if (email && phoneNumber) {
      result = await getUserByBothParam(email, phoneNumber);
    } else if (email) {
      result = await getUserByOneParam(email, "email");
    } else if (phoneNumber) {
      result = await getUserByOneParam(phoneNumber, "phoneNumber");
    }
    if (result) {
      let responseStructure;
      let user = result as User;
      let id: string = "";
      if (user.linkPrecedence === "primary") {
        id = user.id;
      } else if (user.linkPrecedence === "secondary") {
        id = user.linkedId;
      }
      let list: User[] = (await getUsersByLinkedId(id)) as User[];
      if (list.length == 0) {
        responseStructure = {
          contact: {
            primaryContactId: user.id,
            emails: [user.email],
            phoneNumbers: [user.phoneNumber],
            secondaryContactIds: null,
          },
        };
      } else if (list.length > 0) {
        const emails: string[] = [...new Set(list.map((user) => user.email))];
        const phones: string[] = [
          ...new Set(list.map((user) => user.phoneNumber)),
        ];
        const ids: string[] = [
          ...new Set(
            list
              .filter((user) => user.linkPrecedence === "secondary")
              .map((user) => user.id)
          ),
        ];

        responseStructure = {
          contact: {
            primaryContactId: id,
            emails: emails,
            phoneNumbers: phones,
            secondaryContactIds: ids,
          },
        };
      }
      res.status(200).json(responseStructure);
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unknown error occurred");
    }
  }
};
