/**
 * Type that joins object with identification parameters
 */
export type Identifiable<T> = IIdentity & T;

/**
 * Interface that requires identification parameters
 */
export interface IIdentity {
    id: string;
}