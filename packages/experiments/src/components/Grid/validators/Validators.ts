import * as moment from "moment";

export namespace Validators {
    "use strict";

    /**
     * Returns a validator that checks for null and whitespace
     * @param errorMessage Required error message to display
     */
    export function required(errorMessage: string): (value: any) => string {
        'use strict';
        return (value: any): string => {
            if (value == null || value === "") {
                return errorMessage;
            }
        };
    }

    /**
     * Returns a validator that checks the length of a string and ensures its equal to a value. If input null return -1
     * @param length The length of the string
     * @param formatError a callback which takes the length and formats an appropriate error message for validation failed
     */
    export function length(length: number, formatError: (length: number) => string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            value = (value != null ? value : "");
            if (value.length !== length) {
                return formatError(value.length);
            }
        };
    }

    /**
     * Returns a validator that checks the length of a string and ensures its greater than a value (inclusive)
     * @param length The min length of the string
     * @param formatError a callback which takes the values Length and formats an appropriate error message for validation failed
     */
    export function minLength(length: number, formatError: (length: number) => string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            value = (value != null ? value : "");
            if (value.length < length) {
                return formatError(value.length);
            }
        };
    }

    /**
     * Returns a validator that checks the length of a string and ensures its less than a value (inclusive)
     * @param length The max length of the string
     * @param formatError a callback which takes the values length and formats an appropriate error message for validation failed
     */
    export function maxLength(length: number, formatError: (length: number) => string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            value = (value != null ? value : "");
            if (value.length > length) {
                return formatError(value.length);
            }
        };
    }

    /**
     * Returns a validator that calls the passed in regular expression aganist the string using exec()
     * @param regex The regular expression to use.
     * @param errorMessage Required error message to display
     */
    export function regex(regex: RegExp, errorMessage: string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            if (value) {
                if (regex.exec((value)) == null) {
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
    export function minValue(bound: number, formatError: (length: number) => string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            if (value) {
                let intValue: number = Number(value);
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
    export function maxValue(bound: number, formatError: (length: number) => string): (value: string) => string {
        'use strict';
        return (value: string): string => {
            if (value) {
                let intValue: number = Number(value);
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
    export function isInteger(errorMessage: string): (value: string) => string {
        'use strict';
        return (value: string): string => {
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
    export function isNumber(errorMessage: string): (value: string) => string {
        'use strict';
        return (value: string): string => {
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
    export function validMoment(errorMessage: string): (value: moment.Moment) => string {
        'use strict';
        return (value: moment.Moment): string => {
            if (value) {
                if (!value.isValid || !value.isValid()) {
                    return errorMessage;
                }
            }
        };
    }

    export type Validator = (value: any) => string;
}