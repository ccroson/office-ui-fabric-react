import * as _ from 'lodash';
import * as React from 'react';

import { EnumEditor } from '../editors/enumEditor/EnumEditor';
import { GridAction, PickerOpenedAction } from '../actions/GridActions';
import { ICellType, CellContext } from '../grid/Grid';

import { StringUtils } from '../utilities/StringUtils';

/**
 * Class that handles rendering of enum types in the grid in the form of a dropdown.
 * True/false, Single choice, Flags, Enums
 */
export class EnumCell implements ICellType {
  public name = 'EnumCell';

  private enumOptions: EnumOption[];

  constructor(enumOptions: EnumOption[]) {
    this.enumOptions = enumOptions;
  }

  /**
   * Does the cell support callout for editing, so that the grid would open it in Alt + Down
   * Ideally, this should be handled by the editor, but since we want to allow Alt + Down in Select state,
   * the grid has to listen to the event, and react to it
   */
  public get supportsCalloutForEditing(): boolean {
    return true;
  }

  /**
   * Renderer for the cell.
   * @param {EnumCellData} data The value for the grid cell
   * @param {CellContext} context The cell context which provides additional properties, usable for rendering
   */
  public render(cellData: EnumCellData, cellContext: CellContext): JSX.Element | string {
    if (
      !cellData ||
      (this.enumOptions === null || this.enumOptions.length <= 0) ||
      cellContext.inFooterRow ||
      cellData.selectedEnumKey === null ||
      cellData.selectedEnumKey.toString() === ''
    ) {
      return null;
    }
    const value = _.find(this.enumOptions, (option: EnumOption) => {
      return option.key === cellData.selectedEnumKey;
    }).text;
    return value;
  }

  /**
   * Returns a JSX element for the cell in the edit mode
   * @param cellData The cell data extracted through property or accessor
   * @param pendingUpdate The pending update value to be used in the editor
   * @param action The user action performed on the cell
   * @param onValueUpdated The delegate to be called with the updated value for this cell
   * @param onEditCancelled The delegate to call to request the cancelling of any updates
   * @param onEditConfirmed The delegate to call to commit an update,
   * @param context The cell context which provides additional properties, usable for rendering
   */
  public renderEditor(
    cellData: EnumCellData,
    pendingUpdate: string | EnumCellData,
    action: GridAction,
    // tslint:disable-next-line:no-any
    onValueUpdated: (updatedValue: any) => void,
    onEditCancelled: () => void,
    onEditConfirmed: (optionKey: string) => void,
    context: CellContext
  ): JSX.Element {
    return (
      <EnumEditor
        enumOptions={this.enumOptions}
        forceCalloutOpen={true}
        pendingValue={pendingUpdate}
        value={cellData}
        onValueUpdated={onValueUpdated}
        onEditConfirmed={onEditConfirmed}
        onEditCancelled={onEditCancelled}
        action={action}
        width={context.columnWidth}
        theme={context.theme}
      />
    );
  }

  /**
   * Return a JSX.Element or string in the selected mode, when this is the primary cell in the selection
   * @param cellData The cell data extracted through property or accessor
   * @param transitionToEditMode The delegate to transition the grid to edit mode.
   * Accepts optional action that would be passed to renderEditor
   * @param context The cell context which provides additional properties, usable for rendering
   */
  public renderSelected(
    cellData: EnumCellData,
    transitionToEditMode: (action?: GridAction) => void,
    context: CellContext
  ): JSX.Element | string {
    if (context.isEditable(context.coordinate)) {
      return (
        <EnumEditor
          enumOptions={this.enumOptions}
          forceCalloutOpen={false}
          pendingValue={null}
          value={cellData}
          onValueUpdated={null}
          onEditConfirmed={null}
          onCellClick={() => transitionToEditMode(new PickerOpenedAction())}
          width={context.columnWidth}
          theme={context.theme}
        />
      );
    } else {
      return this.render(cellData, context);
    }
  }

  /**
   * Compare two moment objects
   * @param left The left date
   * @param right The right date
   */
  public sortComparator(left: EnumCellData, right: EnumCellData): number {
    // null/undefined set to 0 so that they come before all valid moment objects
    return StringUtils.stringCompareOrdinalCaseInsensitive(
      left.selectedEnumKey.toString(),
      right.selectedEnumKey.toString()
    );
  }

  /**
   * Parses the raw input by the user
   * @param originalValue The cell data extracted through property or accessor
   * @param changedValue The raw input to parse to Object
   */
  // tslint:disable-next-line:no-any
  public parseRawInput(originalValue: EnumCellData, changedValue: string | EnumCellData | any): EnumKey {
    // Verify if the update already has the selected enum key
    if (changedValue.selectedEnumKey !== null) {
      return changedValue.selectedEnumKey;
    }
    // Check if we have an exact match first where the key would be used from a dropdown item click
    let updatedOption = _.find(this.enumOptions, (option: EnumOption) => {
      return option.key === changedValue;
    });
    // If we don't find an exact match and the changed value is only a character, select the first option starting with that character
    if (!updatedOption && changedValue.length === 1) {
      updatedOption = _.find(this.enumOptions, (option: EnumOption) => {
        return option.text.toLowerCase().charAt(0) === changedValue.toLowerCase();
      });
    }
    if (updatedOption) {
      return updatedOption.key;
    }
  }
}

/** Acceptable types for an enum key. Also the type (and value) that is sent in data update */
export type EnumKey = string | boolean | number;

/**
 * Simple key/text to use in an enum cell. When used in a collection, keys should be unique
 */
export type EnumOption = {
  /** Key for this option */
  key: EnumKey;
  /** Displayable text for this option */
  text: string;
};

/** Data used commonly for the EnumCell */
export type EnumCellData = {
  /** Key used to render the cell and dropdown properly */
  selectedEnumKey: EnumKey;
};
