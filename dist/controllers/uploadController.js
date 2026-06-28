"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadURL = void 0;
const generateUploadURL_1 = require("../utils/generateUploadURL");
const getUploadURL = async (req, res) => {
    try {
        const url = await (0, generateUploadURL_1.generateUploadURL)();
        return res.status(200).json({ uploadURL: url });
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
};
exports.getUploadURL = getUploadURL;
