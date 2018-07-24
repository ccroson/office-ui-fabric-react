// OneDrive:IgnoreCodeCoverage
/* tslint:disable:no-parameter-properties */

/**
 * Argument error
 */
export class ArgumentError extends Error {
    constructor(public argumentName?: string, public errorMessage?: string) {
        super();
        if (argumentName) {
            this.message = `${argumentName} was invalid. ${errorMessage || ""}`.trim();
        } else {
            this.message = errorMessage || "";
        }

        this.name = 'ArgumentError';
    }
}