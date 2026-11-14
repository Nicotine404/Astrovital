/** Raised when a domain invariant is violated. Pure TypeScript. */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string = "DOMAIN_RULE_VIOLATION"
  ) {
    super(message);
    this.name = "DomainError";
  }
}
