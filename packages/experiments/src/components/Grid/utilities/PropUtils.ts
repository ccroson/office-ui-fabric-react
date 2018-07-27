/* tslint:disable:no-any */
import * as _ from 'lodash';

export namespace PropUtils {
  /**
   * Utility function to process value or accessor types
   * @returns The value
   */
  export function getValueFromAccessor<T>(accessor: undefined | T | ((...args: any[]) => T), ...args: any[]): T | undefined {
    if (_.isFunction(accessor)) {
      return accessor(...args);
    }

    return accessor;
  }

  /**
   * Utility function to process value or accessor types with a default value
   * @returns The value
   */
  export function getValueFromAccessorWithDefault<T>(
    defaultValue: T,
    accessor: T | ((...args: any[]) => T),
    ...args: any[]
  ): T {
    const value = getValueFromAccessor<T>(accessor, args);

    if (value === null || value === undefined) {
      return defaultValue;
    }

    return value;
  }
}
