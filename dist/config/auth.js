"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
exports.authConfig = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: "5d",
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: "15d",
    },
};
