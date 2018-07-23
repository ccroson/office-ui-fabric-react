// OneDrive:IgnoreCodeCoverage
/* tslint:disable:no-parameter-properties */

/**
 * Prop validation error
 */
export class PropValidationError extends Error {
  constructor(public componentName?: string, public propName?: string, public errorMessage?: string) {
    super();
    if (propName && componentName) {
      this.message = `Property ${propName} on ${componentName} was invalid. ${errorMessage}`;
    } else if (componentName) {
      this.message = `Property on ${componentName} was invalid. ${errorMessage}`;
    } else if (propName) {
      this.message = `Property ${propName} was invalid. ${errorMessage}`;
    } else {
      this.message = errorMessage || '';
    }

    this.name = 'PropValidationError';
  }
}
