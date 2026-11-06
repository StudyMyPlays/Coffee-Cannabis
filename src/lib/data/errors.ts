/** Typed errors thrown by data adapters. Client-safe (no node imports). */

export type DataErrorCode = "FOUNDING_DRINK" | "CONTENT_READ_ONLY" | "NOT_FOUND" | "CONFLICT";

export class DataError extends Error {
  readonly code: DataErrorCode;
  constructor(code: DataErrorCode, message: string) {
    super(message);
    this.name = "DataError";
    this.code = code;
  }
}

/** Founding Five drinks are permanent and cannot be deleted. */
export class FoundingDrinkError extends DataError {
  constructor(slug: string) {
    super("FOUNDING_DRINK", `"${slug}" is one of the Founding Five and cannot be deleted.`);
    this.name = "FoundingDrinkError";
  }
}

/** Content (gatherings/drinks) cannot be persisted on this host. */
export class ContentReadOnlyError extends DataError {
  constructor() {
    super(
      "CONTENT_READ_ONLY",
      "Content edits can't be saved on this host (read-only filesystem). Edit content/*.json in the repository or connect a database adapter.",
    );
    this.name = "ContentReadOnlyError";
  }
}

export class NotFoundError extends DataError {
  constructor(what: string) {
    super("NOT_FOUND", `${what} not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DataError {
  constructor(message: string) {
    super("CONFLICT", message);
    this.name = "ConflictError";
  }
}

export function isDataError(e: unknown): e is DataError {
  return e instanceof DataError;
}
