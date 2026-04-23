export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg: string, code = 'bad_request'): HttpError =>
  new HttpError(400, code, msg);
export const unauthorized = (msg = 'Unauthorized', code = 'unauthorized'): HttpError =>
  new HttpError(401, code, msg);
export const forbidden = (msg = 'Forbidden', code = 'forbidden'): HttpError =>
  new HttpError(403, code, msg);
export const notFound = (msg = 'Not found', code = 'not_found'): HttpError =>
  new HttpError(404, code, msg);
export const conflict = (msg: string, code = 'conflict'): HttpError =>
  new HttpError(409, code, msg);
