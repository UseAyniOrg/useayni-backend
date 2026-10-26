"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEmailProvider = exports.EmailDeliveryError = void 0;
class EmailDeliveryError extends Error {
    constructor(code, retryAfterSeconds = 60) {
        super(`Email delivery: ${code}`);
        this.code = code;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
exports.EmailDeliveryError = EmailDeliveryError;
class MockEmailProvider {
    constructor() {
        this.name = 'mock';
    }
    async send(message) {
        return { messageId: `mock:${message.id}` };
    }
}
exports.MockEmailProvider = MockEmailProvider;
