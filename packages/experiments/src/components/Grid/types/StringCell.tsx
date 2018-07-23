import * as React from 'react';

import { ICellType, CellContext } from '../grid/Grid';
import { GridAction } from '../actions/GridActions';
import { StringUtils } from '../utilities/StringUtils';
import { StringEditor } from '../editors/stringEditor/StringEditor';

/**
 * The default string type for Grid
 * Simply returns a toString of the data
 */
export class StringCell implements ICellType {
  /**
   * Given the cell data, return a rendered JSX.Element. Use this for custom controls
   */
  public render(cellData: any, context: CellContext): JSX.Element | string {
    return this.toString(cellData);
  }

  /**
   * Returns a JSX element for the cell in the edit mode
   * @param cellData - The cell data extracted through property or accessor
   * @param pendingUpdate - The pending update value to be used in the editor
   * @param action The user action performed on the cell
   * @param onValueUpdated - The delegate to be called with the updated value for this cell
   * @param onEditCancelled - The delegate to call to request the cancelling of any updates
   * @param onEditConfirmed - The delegate to call to commit an update,
   * @param context The cell context which provides additional properties, usable for rendering
   */
  public renderEditor(
    cellData: string,
    pendingUpdate: string,
    action: GridAction,
    onValueUpdated: (updatedValue: string) => void,
    onEditCancelled: () => void,
    onEditConfirmed: (finalValue: string) => void,
    context: CellContext
  ): JSX.Element {
    return (
      <StringEditor
        value={pendingUpdate != null ? pendingUpdate : cellData}
        onValueUpdated={onValueUpdated}
        onEditConfirmed={onEditConfirmed}
      />
    );
  }

  /**
   * Given the cell data, return the aria label to be used for screen-readers
   * @param cellData The cell data extracted through property or accessor
   */
  public getAriaAndDataAttributes(cellData: any): _.Dictionary<string> {
    return cellData && { 'aria-label': cellData };
  }

  /**
   * Compare two objects
   * @param left The left object
   * @param right The right object
   */
  public sortComparator(left: any, right: any): number {
    return StringUtils.stringCompareOrdinalCaseInsensitive(this.toString(left), this.toString(right));
  }

  /**
   * Returns the string representation of the cell data
   * @param cellData The cell data extracted through property or accessor
   */
  public toString(cellData: string): string {
    if (cellData == null) {
      return '';
    }
    return cellData.toString();
  }

  /**
   * Parses the raw input by the user
   * @param originalValue The cell data extracted through property or accessor
   * @param changedValue The raw input to parse to Object
   */
  public parseRawInput(originalValue: string, changedValue: any): string {
    return this.toString(changedValue);
  }
}
