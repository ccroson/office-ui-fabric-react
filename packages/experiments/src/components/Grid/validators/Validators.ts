/* tslint:disable:no-any */
import * as moment from 'moment';

export namespace Validators {
  /**
   * Returns a validator that checks for null and whitespace
   * @param errorMessage Required error message to display
   */
  export function required(errorMessage: string): (value: any) => string | undefined {
    return (value: any): string | undefined => {
      if (value === null || value === undefined || value === '') {
        return errorMessage;
      }
    };
  }

  /**
   * Returns a validator that checks the length of a string and ensures its equal to a value. If input null return -1
   * @param strLen The length of the string
   * @param formatError a callback which takes the length and formats an appropriate error message for validation failed
   */
  export function length(
    strLen: number,
    formatError: (length: number) => string
  ): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      value = value !== null && value !== undefined ? value : '';
      if (value.length !== strLen) {
        return formatError(value.length);
      }
    };
  }

  /**
   * Returns a validator that checks the length of a string and ensures its greater than a value (inclusive)
   * @param strLen The min length of the string
   * @param formatError a callback which takes the values Length and formats an appropriate error message for validation failed
   */
  export function minLength(
    strLen: number,
    formatError: (length: number) => string
  ): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      value = value !== null && value !== undefined ? value : '';
      if (value.length < strLen) {
        return formatError(value.length);
      }
    };
  }

  /**
   * Returns a validator that checks the length of a string and ensures its less than a value (inclusive)
   * @param strLen The max length of the string
   * @param formatError a callback which takes the values length and formats an appropriate error message for validation failed
   */
  export function maxLength(
    strLen: number,
    formatError: (length: number) => string
  ): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      value = value !== null && value !== undefined ? value : '';
      if (value.length > strLen) {
        return formatError(value.length);
      }
    };
  }

  /**
   * Returns a validator that calls the passed in regular expression aganist the string using exec()
   * @param regExp The regular expression to use.
   * @param errorMessage Required error message to display
   */
  export function regex(regExp: RegExp, errorMessage: string): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      if (value) {
        if (regExp.exec(value) === null) {
          return errorMessage;
        }
      }
    };
  }

  /**
   * Returns a validator that checks if a number is greater than the provided bound
   * @param bound The bound
   * @param formatError a callback which takes the length and formats an appropriate error message for validation failed
   */
  export function minValue(
    bound: number,
    formatError: (length: number) => string
  ): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      if (value) {
        const intValue: number = Number(value);
        if (!isNaN(intValue) && intValue < bound) {
          return formatError(intValue);
        }
      }
    };
  }

  /**
   * Returns a validator that checks if a number is less than the provided bound
   * @param bound The bound
   * @param formatError a callback which takes the length and formats an appropriate error message for validation failed
   */
  export function maxValue(
    bound: number,
    formatError: (length: number) => string
  ): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      if (value) {
        const intValue: number = Number(value);
        if (!isNaN(intValue) && intValue > bound) {
          return formatError(intValue);
        }
      }
    };
  }

  /**
   * Returns a validator that checks if a number is an integer
   * @param errorMessage Required error message to display
   */
  export function isInteger(errorMessage: string): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      if (value) {
        if (Number(value) % 1 !== 0) {
          return errorMessage;
        }
      }
    };
  }

  /**
   * Returns a validator that ensures the value is a number
   * @param errorMessage Required error message to display
   */
  export function isNumber(errorMessage: string): (value: string) => string | undefined {
    return (value: string): string | undefined => {
      if (value) {
        if (isNaN(Number(value))) {
          return errorMessage;
        }
      }
    };
  }

  /**
   * Returns a validator that ensures the value is a valid moment
   * @param errorMessage Required error message to display
   */
  export function validMoment(errorMessage: string): (value: moment.Moment) => string | undefined {
    return (value: moment.Moment): string | undefined => {
      if (value) {
        if (!value.isValid || !value.isValid()) {
          return errorMessage;
        }
      }
    };
  }

  export type Validator = (value: any) => string | undefined;
}
