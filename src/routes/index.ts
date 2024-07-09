import { Router, Request, Response } from "express";
import { getIdentity } from "../controllers/userController";

const router = Router();

router.get("/identify", getIdentity);

export { router };
