// OneDrive:IgnoreCodeCoverage
/**
 * Invalid operation error
 */
export class InvalidOperationError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = 'InvalidOperationError';
  }
}
