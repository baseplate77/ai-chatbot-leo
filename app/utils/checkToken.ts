import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

export const checkToken = (req: Request, res: Response, next: NextFunction) => {

    try {
        const header = req.headers['authorization'];

        if (header === undefined) throw ("authorization header are not define")

        const bearer = header.split(' ');
        const token = bearer[1];
        // console.log("JWT secret : ", process.env.JWT_SECRET_KEY);

        const result = jwt.verify(token, process.env.JWT_SECRET_KEY!,) as any;
        console.log("result : ", result.id);
        (req as any).user = result.id;

        next();
    } catch (error) {
        console.log("error in checktoken :", error);
        //If header is undefined return Forbidden (403)
        res.status(403).send({ error })
    }
}