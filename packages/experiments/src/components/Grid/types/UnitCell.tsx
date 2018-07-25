import * as React from 'react';
import _ = require('lodash');

// controls
import { ICellType, CellContext } from '../grid/Grid';
import { __InlineAutoCompleteBox as UnitEditor } from '../controls/inlineAutoCompleteBox/__InlineAutoCompleteBox';

// utils
import { ArgumentError } from '../utilities/errors/Errors';
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';
import { GridAction } from '../actions/GridActions';
import { ParseUtils } from '../utilities/ParseUtils';

/**
 * Default value to set the cell to if it is null or undefined
 */
const DEFAULT_CELL_VALUE: string = '';

/**
 * Class that handles rendering of 'unit' types in the grid where the value is a number
 */
export class UnitCell implements ICellType {

    /** Callback to convert the internal value into a displayable format */
    private getDisplayValue: (data: UnitCellData) => string;
    /** Callback to parse cell data to a usable format */
    private parser: (data: UnitCellData) => string | number;
    /** The formats in which input is accepted */
    private acceptableOptions: UnitOption[];

    /**
     * UnitCell does not support callout for editing
     */
    public get supportsCalloutForEditing(): boolean {
        return false;
    }

    /**
     * Creates an instance of UnitCell for Grid
     * @param acceptableOptions The formats in which input is accepted
     * @param getDisplayValue Callback to get the string to display in the input cell
     * @param parser The parser callback to parse cell data
     */
    constructor(
        acceptableOptions: UnitOption[],
        getDisplayValue: (data: UnitCellData) => string,
        parser: (data: UnitCellData) => string | number) {
        if (!_.isFunction(getDisplayValue)) {
            throw new ArgumentError('getDisplayValue', 'Should be a valid function');
        }

        this.acceptableOptions = acceptableOptions;
        this.getDisplayValue = getDisplayValue;
        this.parser = parser;
    }

    /**
     * Renderer for the cell.
     * @param {UnitCellData} data The value for the grid cell
     */
    public render(data: UnitCellData): string {
        return this.getDisplayValue(data);
    }

    /**
     * Returns a JSX element for the cell in the edit mode
     * @param cellData The cell data extracted through property or accessor
     * @param pendingUpdate The pending update value to be used in the editor
     * @param action The user action performed on the cell
     * @param onValueUpdated The delegate to call with the updated value for this cell
     * @param onEditCancelled The delegate to call to request the cancelling of any updates
     * @param onEditConfirmed The delegate to call to commit an update,
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderEditor(
        cellData: UnitCellData,
        pendingUpdate: string,
        action: GridAction,
        onValueUpdated: (value: string) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: string) => void,
        context: CellContext
    ): JSX.Element {
        return (
            <UnitEditor
                value={ pendingUpdate != null ? pendingUpdate.toString() : (cellData ? this.getDisplayValue(cellData) : DEFAULT_CELL_VALUE) }
                suggestedValue={ pendingUpdate != null ? this.getSuggestedValue(pendingUpdate.toString()) : DEFAULT_CELL_VALUE }
                onChange={ onValueUpdated }
            />
        );
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object (string when editing, UnitCellData for fillhandles)
     */
    public parseRawInput(originalValue: string, changedValue: string | UnitCellData | any): string | number {
        if (changedValue) {
            // Verify if the update already has the value
            if (changedValue.value) {
                return changedValue.value;
            }
            let value = parseFloat(changedValue);
            let updatedOption: UnitOption = _.find(this.acceptableOptions, (option: UnitOption) => { return _.startsWith(option.text, ParseUtils.extractAlphaString(changedValue)); });
            if (this.parser) {
                return this.parser({ selectedUnitOption: updatedOption, value: value });
            } else {
                return updatedOption.text || DEFAULT_CELL_VALUE;
            }
        }
    }

    /**
     * Get the suggested value given a partial value
     * @param currentValue The current value based off of which the suggestion is generated
     */
    @autobind
    public getSuggestedValue(currentValue: string): string {
        if (currentValue) {
            let inputUnits: string = ParseUtils.extractAlphaString(currentValue);
            if (inputUnits && this.acceptableOptions) {
                let suggestedUnit: UnitOption = _.first(_.filter(this.acceptableOptions, (format: UnitOption) => { return _.startsWith(format.text.toLocaleUpperCase(), inputUnits.toLocaleUpperCase()); }));
                if (suggestedUnit) {
                    return _.replace(currentValue, inputUnits, suggestedUnit.text); // Remove the units we found and use only the value
                }
            }
        }
        return DEFAULT_CELL_VALUE;
    }
}

/** Key Value pair where the key is used by the consumer and the value is displayed in suggestions */
export type UnitOption = {
    key: string | number;
    text: string;
};

/** CellData for UnitCell that contains the value (without units) and the option the user used for suggestions */
export type UnitCellData = {
    selectedUnitOption: UnitOption;
    value: number;
};