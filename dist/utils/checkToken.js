"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkToken = (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        if (header === undefined)
            throw ("authorization header are not define");
        const bearer = header.split(' ');
        const token = bearer[1];
        // console.log("JWT secret : ", process.env.JWT_SECRET_KEY);
        const result = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        console.log("result : ", result.id);
        req.user = result.id;
        next();
    }
    catch (error) {
        console.log("error in checktoken :", error);
        //If header is undefined return Forbidden (403)
        res.status(403).send({ error });
    }
};
exports.checkToken = checkToken;
