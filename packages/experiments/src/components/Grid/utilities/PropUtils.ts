import * as _ from 'lodash';

export namespace PropUtils {
  /**
   * Utility function to process value or accessor types
   * @returns The value
   */
  export function getValueFromAccessor<T>(accessor: T | ((...args: any[]) => T), ...args: any[]): T {
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
    let value: T = getValueFromAccessor<T>(accessor, args);

    if (value == null) {
      return defaultValue;
    }

    return value;
  }
}
