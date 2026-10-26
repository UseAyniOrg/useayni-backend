"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberIdFromAccessToken = getMemberIdFromAccessToken;
exports.decodeToken = decodeToken;
const jwt = __importStar(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
/**
 * Extrai o memberId do accessToken
 * @param accessToken - O token de acesso JWT
 * @returns O memberId
 * @throws Error se o token for inválido ou expirado
 */
function getMemberIdFromAccessToken(accessToken) {
    if (!auth_1.authConfig.jwt.secret) {
        throw new Error("JWT secret is not defined");
    }
    try {
        const decoded = jwt.verify(accessToken, auth_1.authConfig.jwt.secret);
        return decoded.id;
    }
    catch (error) {
        throw new Error("Token inválido ou expirado");
    }
}
/**
 * Decodifica o token completo
 */
function decodeToken(accessToken) {
    if (!auth_1.authConfig.jwt.secret) {
        throw new Error("JWT secret is not defined");
    }
    try {
        return jwt.verify(accessToken, auth_1.authConfig.jwt.secret);
    }
    catch (error) {
        throw new Error("Token inválido ou expirado");
    }
}
