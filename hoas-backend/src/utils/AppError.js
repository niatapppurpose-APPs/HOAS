export class AppError extends Error {
  constructor(statusCode, code, message = '') {
    super(message || code);
    this.statusCode = statusCode;
    this.code = code;
  }
}