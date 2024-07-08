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
exports.getIdentity = void 0;
const userService_1 = require("../services/userService");
const getIdentity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) {
            return res.status(400).send("Email or phone number is required");
        }
        let result;
        if (email && phoneNumber) {
            result = yield (0, userService_1.getUserByBothParam)(email, phoneNumber);
        }
        else if (email) {
            result = yield (0, userService_1.getUserByOneParam)(email, "email");
        }
        else if (phoneNumber) {
            result = yield (0, userService_1.getUserByOneParam)(phoneNumber, "phoneNumber");
        }
        if (result) {
            let responseStructure;
            let user = result;
            let id = "";
            if (user.linkPrecedence === "primary") {
                id = user.id;
            }
            else if (user.linkPrecedence === "secondary") {
                id = user.linkedId;
            }
            let list = (yield (0, userService_1.getUsersByLinkedId)(id));
            if (list.length == 0) {
                responseStructure = {
                    contact: {
                        primaryContactId: user.id,
                        emails: [user.email],
                        phoneNumbers: [user.phoneNumber],
                        secondaryContactIds: null,
                    },
                };
            }
            else if (list.length > 0) {
                const emails = [...new Set(list.map((user) => user.email))];
                const phones = [
                    ...new Set(list.map((user) => user.phoneNumber)),
                ];
                const ids = [
                    ...new Set(list
                        .filter((user) => user.linkPrecedence === "secondary")
                        .map((user) => user.id)),
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
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        }
        else {
            res.status(500).send("An unknown error occurred");
        }
    }
});
exports.getIdentity = getIdentity;
