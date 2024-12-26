"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
// src/utils/otp.ts
const otp_generator_1 = __importDefault(require("otp-generator"));
const generateOTP = () => {
    return otp_generator_1.default.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
};
exports.generateOTP = generateOTP;
//# sourceMappingURL=otp.js.map