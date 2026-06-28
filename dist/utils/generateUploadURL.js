"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUploadURL = void 0;
const aws_1 = __importDefault(require("../config/aws"));
const nanoid_1 = require("nanoid");
const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${(0, nanoid_1.nanoid)()}-${date.getTime()}.jpeg`;
    const url = await aws_1.default.getSignedUrlPromise("putObject", {
        Bucket: "mern-blog-webapp45",
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg",
    });
    return url;
};
exports.generateUploadURL = generateUploadURL;
