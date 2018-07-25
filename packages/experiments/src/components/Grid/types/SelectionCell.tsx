/* tslint:disable:no-any */
import * as React from 'react';

import { Check } from 'office-ui-fabric-react/lib-commonjs/Check';
import { ICellType, CellContext } from '../grid/Grid';

/**
 * The selection column used for the list type of grid
 * Uses a checkbox to show if it's selected or not
 */
export class SelectionCell implements ICellType {
    /**
     * Return a JSX.Element or string in the default mode
     * @param cellData The cell data extracted through property or accessor
     * @param context The cell context which provides additional properties, like isSelected in this case
     */
    public render(cellData: any, context: CellContext): JSX.Element | string {
        return <Check checked={ context.isSelected(context.coordinate) } />;
    }

    /**
     * Given the cell data, return the aria label to be used for screen-readers
     * @param cellData The cell data extracted through property or accessor
     */
    public getAriaAndDataAttributes(cellData: any): _.Dictionary<string> {
        return { 'aria-label': '' }; // ToDo (Bug 1509135): Replace with aria label
    }

    /**
     * Compare two objects
     * @param left The left object
     * @param right The right object
     */
    public sortComparator(left: any, right: any): number {
        throw new Error('Selection Cell column is not sortable');
    }

    /**
     * Returns the string representation of the cell data
     * @param cellData The cell data extracted through property or accessor
     */
    public toString(cellData: any): string {
        return '';
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object
     */
    public parseRawInput(originalValue: any, changedValue: any): any {
        throw new Error('Selection cell is not editable');
    }
}
