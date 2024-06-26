import express, { Request, Response } from "express";
import { currentUser } from "../middlewares/current-user";

const router = express.Router();

router.get(
  "/api/users/currentuser",
  currentUser,
  (req: Request, res: Response) => {
    console.log("current-user: ", req.currentUser);
    return res.send({ currentUser: req.currentUser || null });
  }
);

export { router as CurrentUserRouter };
