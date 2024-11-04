"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareEncrypedData = exports.encryptData = void 0;
const bcryptjs_1 = require("bcryptjs");
const encryptData = async (data) => (0, bcryptjs_1.hash)(data, 10);
exports.encryptData = encryptData;
const compareEncrypedData = async (data, encryptData) => (0, bcryptjs_1.compare)(data, String(encryptData));
exports.compareEncrypedData = compareEncrypedData;
//# sourceMappingURL=crypt.js.map