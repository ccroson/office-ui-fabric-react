/* tslint:disable:no-any */
import * as _ from 'lodash';

import { ArgumentNullError } from '../utilities/errors/Errors';
import { CellRegionPosition, GridCoordinate, GridRegion } from '../common/Common';
import { IColumnDefinition, ICellDefinition } from '../grid/Grid';

export namespace GridUtilities {
  /**
   * Gets the data to render using the column definition.
   * Either uses the property name or the accessor method
   * @param data The entire row object
   * @param columnDefinition The column definition to use
   */
  export function getDataFromColumnDefinition(data: Object, columnDefinition: IColumnDefinition): any {
    const cellDefinition: ICellDefinition = columnDefinition.cell;
    let dataToRender: any = null;
    // 1st Pri: Use the property name if it is defined
    if (cellDefinition.property) {
      dataToRender = getNestedData(data, cellDefinition.property);
      // 2nd Pri: Use the accessory method if it is defined
    } else if (cellDefinition.accessor) {
      dataToRender = cellDefinition.accessor(data);
      // No way to retrieve the data was defined, bug out
    } else {
      throw new Error('Property and accessor were both undefined on the column definition');
    }
    return dataToRender;
  }

  /**
   * Gets a value from an object and a property string.
   * The data can be any Javascript object and the property string can be any number of properties separated by '.', such as 'prop1.prop2'
   * EX. getNestedData({a: b: {c: {d: 1}}}, 'a.b.c.d') => 1
   * @param data The entire row data object
   * @param propertyName The property string
   */
  function getNestedData(data: Object, propertyName: string): any {
    return _.get(data, propertyName);
  }

  /**
   * Returns if a given cell is inside any of the selections
   * @param cellCoordinate The coordinate of the cell to check
   * @param selections The array of selection regions to check
   * @throws if cellCoordinate is null
   */
  export function isCellInsideAnySelection(cellCoordinate: GridCoordinate, selections: GridRegion[]): boolean {
    if (!cellCoordinate) {
      throw new ArgumentNullError('cellCoordinate');
    }

    if (!selections) {
      return false;
    }

    return _.some(selections, (selection: GridRegion) => selection.isCellInRegion(cellCoordinate));
  }

  /**
   * Returns the position of a cell within the first selected regions containing the cell
   * @param cellCoordinate The coordinate of the cell to check
   * @param selections The array of selection regions to check
   * @param cellRowSpan The RowSpan of the cell
   * @returns {CellRegionPosition} corresponding to the first region which contains the cell, null if no region contains the cell
   * @throws if cellCoordinate is null
   */
  export function getCellRegionPositionIfSelected(
    cellCoordinate: GridCoordinate,
    selections: GridRegion[],
    cellRowSpan: number
  ): CellRegionPosition | null {
    if (!cellCoordinate) {
      throw new ArgumentNullError('cellCoordinate');
    }

    const containingSelection = _.find(selections, (selection: GridRegion) => selection.isCellInRegion(cellCoordinate));
    if (containingSelection) {
      return containingSelection.getCellPosition(cellCoordinate, cellRowSpan);
    }

    return null;
  }
}
