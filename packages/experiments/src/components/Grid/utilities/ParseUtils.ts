/**
 * Utility class for Parsing
 */
export namespace ParseUtils {
    /**
     * Extract the alpha string from an input value
     * @param {string} value Input string from which the alpha string is to be extracted
     */
    export function extractAlphaString(value: string): string {
        if (!value) {
            return null;
        }
        return value.toString().match(/[a-zA-Z]/g) ? value.match(/[a-zA-Z]/g).join('') : null;
    }
}