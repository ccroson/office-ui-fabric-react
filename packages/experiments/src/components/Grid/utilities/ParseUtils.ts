/**
 * Utility class for Parsing
 */
export namespace ParseUtils {
    /**
     * Extract the alpha string from an input value
     * @param {string} value Input string from which the alpha string is to be extracted
     */
    export function extractAlphaString(value: string): string|null {
        if (value && value.toString().match(/[a-zA-Z]/g)) {
            const result = value.match(/[a-zA-Z]/g);
            return result && result.join('');
        }
        return null;
    }
}
