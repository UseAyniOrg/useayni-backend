"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCpf = isValidCpf;
function isValidCpf(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits))
        return false;
    const calculateDigit = (base, factor) => {
        const total = base.split('').reduce((sum, digit) => sum + Number(digit) * factor--, 0);
        const remainder = (total * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };
    return calculateDigit(digits.slice(0, 9), 10) === Number(digits[9]) &&
        calculateDigit(digits.slice(0, 10), 11) === Number(digits[10]);
}
