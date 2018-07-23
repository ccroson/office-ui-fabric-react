export namespace StringUtils {
  'use strict';
  /**
   * Compare strings in ordinal manner, without case sensitivity. Returns less than 0, 0, or greater than 0 based on the comparison.
   * @param left The left side of the comparison
   * @param right The right side of the comparison
   */
  export function stringCompareOrdinalCaseInsensitive(left: string, right: string): number {
    'use strict';
    return stringCompareOrdinal(left.toLowerCase(), right.toLowerCase());
  }

  /**
   * Compare strings in ordinal manner, with case sensitivity. Returns less than 0, 0, or greater than 0 based on the comparison.
   * @param left The left side of the comparison
   * @param right The right side of the comparison
   */
  export function stringCompareOrdinal(left: string, right: string) {
    'use strict';
    return left < right ? -1 : left > right ? 1 : 0;
  }

  /** Retrive the initials from the name
   * Examples:
   * Blank -> B
   * Joe Smith -> JS
   * Jane Meredith Smith -> JM
   * Contoso Project -> CP
   * @param displayName The name to create initials for
   */
  export function parseInitialsFromName(displayName: string): string {
    'use strict';
    let retVal: string = '';

    if (displayName) {
      displayName = displayName.replace(/[&#.*;]/g, '');
      let displayWords = displayName.split(/\s/);

      // No spaces
      if (displayWords.length === 1) {
        retVal = displayWords[0].substr(0, 2).toLocaleUpperCase();
      } else {
        let initialName = displayWords.map((s: string) => s.charAt(0)).join('');
        retVal = (initialName.charAt(0) + initialName.charAt(1)).toLocaleUpperCase();
      }
    }

    return retVal;
  }
}
