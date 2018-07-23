// OneDrive:IgnoreCodeCoverage
/* tslint:disable:no-parameter-properties */

/**
 * Argument null error
 */
export class ArgumentNullError extends Error {
  constructor(public argumentName?: string, public errorMessage?: string) {
    super();
    if (argumentName) {
      this.message = `${argumentName} cannot be null. ${errorMessage || ''}`.trim();
    } else {
      this.message = errorMessage || '';
    }

    this.name = 'ArgumentNullError';
  }
}
