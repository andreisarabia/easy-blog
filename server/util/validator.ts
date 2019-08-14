const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const is_alphanumeric = (input: string) => /^[a-zA-Z0-9_]*$/.test(input);
const is_email = (input: string) => emailRegex.test(input);

export { is_alphanumeric, is_email };
