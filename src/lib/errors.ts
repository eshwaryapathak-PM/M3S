// Typed M3S errors. Each carries a stable `code` so UI / logging can branch
// without parsing messages. Phase 0 seeds the file; later phases extend.

export class M3SError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'M3SError';
  }
}

export class ConsentRequiredError extends M3SError {
  constructor(message = 'Health-data consent is required to proceed.') {
    super(message, 'consent_required');
    this.name = 'ConsentRequiredError';
  }
}

export class RLSDeniedError extends M3SError {
  readonly resource: string;
  constructor(resource: string) {
    super(`Access denied: ${resource}`, 'rls_denied');
    this.resource = resource;
    this.name = 'RLSDeniedError';
  }
}

export class BookingCutoffError extends M3SError {
  constructor() {
    super('Booking closed — opens 8 PM tonight.', 'booking_cutoff');
    this.name = 'BookingCutoffError';
  }
}
