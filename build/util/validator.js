"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const is_alphanumeric = (input) => /^[a-zA-Z0-9_]*$/.test(input);
exports.is_alphanumeric = is_alphanumeric;
const is_email = (input) => emailRegex.test(input);
exports.is_email = is_email;
