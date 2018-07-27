import * as React from 'react';
import * as _ from 'lodash';

import { BaseComponent } from '../utilities/BaseComponent';
import { Cell } from './Cell';
import { css } from '../../../../../utilities/lib-commonjs/css';
import { getNativeProps } from '../../../../../utilities/lib-commonjs/properties';
import { GridUtilities } from '../utilities/GridUtilities';
import { PropUtils } from '../utilities/PropUtils';
import { RowHeaderCell } from './RowHeaderCell';
import { SelectionState } from '../managers/StateManager';
import { SpacerCell } from './SpacerCell';

import { GridCoordinate, GridMode, GridTheme } from '../common/Common';

/** Position of any row being edited offscreen in virtualized mode */
const EDITING_ROW_TOP = -10000;
/** Number of pixels to pad cell content */
const CELL_PADDING = 5;

export interface IRowProps {
  /*-----------------------
    |                       |
    | RENDERING INFORMATION |
    |                       |
    -----------------------*/
  /** The aria and data attributes for this row */
  ariaAndDataAttributes?: _.Dictionary<string>;

  /** The aria and data attributes to apply to each cell container. It's important to note that this wraps the cell content */
  cellAriaAndDataAttributes?: _.Dictionary<string> | ((cellCoordinate: GridCoordinate) => _.Dictionary<string> | undefined);

  /** The class name to append to each cell container. It's important to note that this wraps the cell content */
  cellClassName?: string | ((cellCoordinate: GridCoordinate) => string);

  /** The class name for the row */
  className?: string;

  /**
   * Canary of the grid, gets updated when the grid receives new data,
   * Used to check if row should update when new props are passed
   */
  dirtyCanary: any;

  /** Should the row be fixed offscreen? */
  fixedOffScreen: boolean;

  /** Is the user resizing a column, used to determine if the row should re-render or not */
  isColumnResizing: boolean;

  /** Is fill enabled? */
  isFillEnabled: boolean;

  /** Is the grid scrolling, used to determine if the row should re-render or not */
  isGridScrolling: boolean;

  /** Is the row part of the user selection? */
  isRowActive: boolean;

  /** Is the row included in the selections */
  isRowWithinSelection: boolean;

  /** The number of columns to render in the row */
  numColumns: number;

  /** The width of the row header */
  rowHeaderWidth: number;

  /** The height of the row in pixels */
  rowHeight: number;

  /** The index of this row */
  rowIndex: number;

  /** The current selection state of the grid */
  selectionState: SelectionState;

  /** Defines the theme used for styling the cells and header */
  theme: GridTheme;

  /** Index of the last visible row */
  visibleRowEnd: number;

  /** Index of the first visible row */
  visibleRowStart: number;

  /** Delegate to get the cell identifier */
  getCellIdentifier: (cellCoordinate: GridCoordinate) => string;

  /** Delegate to get the row span of a cell */
  getCellRowSpan: (cellCoordinate: GridCoordinate) => number;

  /** Delegate to get the cell width */
  getCellWidth: (colIndex: number) => number;

  /** Delegate to get the cell role */
  getCellRole: (cellCoordinate: GridCoordinate) => string;

  /** Delegate to get if the cell is selectable */
  isCellSelectable: (cellCoordinate: GridCoordinate) => boolean;

  /** Delegate to get if the cell is editable */
  isCellEditable?: (cellCoordinate: GridCoordinate) => boolean;

  /**
   * The cell renderer. Should return any data you want to display in the grid
   * @param cellCoordinate The coordinate of the cell to render
   * @param columnWidth The width of the column that this cell is in
   * @returns Either a string or a JSX.Element to display in the cell
   */
  onRenderCell: (cellCoordinate: GridCoordinate, columnWidth: number) => React.ReactNode;
  /**
   * The row header renderer. Should return any information you want to display in the row header
   * @param rowIndex The row index for the header cell
   * @returns Either a string or a JSX.Element to display in the header
   */
  onRenderRowHeaderCell?: (rowIndex: number) => React.ReactNode;

  /*----------------
    |                |
    | EVENT HANDLERS |
    |                |
    ----------------*/
  /**
   * Called when a cell is clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called when a cell is right clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellRightClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called when a cell is double clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellDoubleClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called when a mouse down is performed on a cell
   * @param cellCoordinate The coordinate of the cell
   * @param event The associated MouseEvent
   */
  onCellMouseDown?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called when a mouse enter is performed on a cell
   * @param cellCoordinate The coordinate of the cell
   * @param event The associated MouseEvent
   */
  onCellMouseEnter?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called when mouse down on the fill handle of the current selection
   * @param event The associated MouseEvent
   */
  onFillMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called for mousedown event on a row header
   * @param rowIndex The index of the row
   * @param event The MouseEvent related to the click
   */
  onRowHeaderMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called for mouseenter event on a row header
   * @param event The MouseEvent related to the click
   */
  onRowHeaderMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * Called for right click/context menu event on a row header
   * @param event The MouseEvent related to the click
   */
  onRowHeaderRightClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Row component for use within BaseGrid. Contains Cell components as children
 */
export class Row extends BaseComponent<IRowProps, {}> {
  /** Get a cell ref by column index */
  public getCellRef(columnIndex: number): Cell {
    return this.refs[`${columnIndex}`] as Cell;
  }

  public name(): string {
    return 'Row';
  }

  /**
   * Compare the canary with the new canary passed in.
   * If the canary is different, it means this row is dirty
   * @param nextProps New props passed to the component
   */
  public shouldComponentUpdate(nextProps: IRowProps): boolean {
    // if grid is scrolling, we don't want to re-render the rows
    if (nextProps.isGridScrolling) {
      return false;
    }

    // if a column is resizing, we want to re-render the rows
    if (nextProps.isColumnResizing) {
      return true;
    }

    return (
      nextProps.dirtyCanary !== this.props.dirtyCanary ||
      nextProps.fixedOffScreen !== this.props.fixedOffScreen ||
      nextProps.isRowWithinSelection ||
      this.props.isRowWithinSelection ||
      (nextProps.selectionState &&
        (nextProps.selectionState.mode === GridMode.Filling ||
          // Don't render row if grid is just transitioning to/from selecting state.
          (nextProps.selectionState.mode !== GridMode.Selecting &&
            this.props.selectionState.mode !== GridMode.Selecting &&
            nextProps.selectionState.mode !== this.props.selectionState.mode)))
    );
  }

  protected renderComponent(): JSX.Element {
    const { ariaAndDataAttributes, className, fixedOffScreen, rowIndex, rowHeight } = this.props;

    const rowStyle: React.CSSProperties = {
      height: rowHeight,
      position: fixedOffScreen ? 'fixed' : undefined,
      top: fixedOffScreen ? EDITING_ROW_TOP : undefined
    };

    return (
      <div
        {...getNativeProps(ariaAndDataAttributes || {}, [])}
        aria-rowindex={rowIndex + 1}
        className={css('grid-row', className)}
        role="row"
        style={rowStyle}
      >
        {this.renderCells()}
      </div>
    );
  }

  private getRowHeaderId(): string {
    return `rowHeader_${this.props.rowIndex}`;
  }

  private renderCells(): JSX.Element[] {
    const {
      cellAriaAndDataAttributes,
      cellClassName,
      dirtyCanary,
      getCellIdentifier,
      getCellRowSpan,
      getCellWidth,
      getCellRole,
      isCellSelectable,
      isCellEditable,
      isFillEnabled,
      isRowActive,
      numColumns,
      onCellClick,
      onCellDoubleClick,
      onCellMouseDown,
      onCellMouseEnter,
      onCellRightClick,
      onFillMouseDown,
      onRenderCell,
      onRenderRowHeaderCell,
      onRowHeaderMouseDown,
      onRowHeaderMouseEnter,
      onRowHeaderRightClick,
      rowHeaderWidth,
      rowHeight,
      rowIndex,
      selectionState,
      theme
    } = this.props;

    const cells: JSX.Element[] = [];
    if (onRenderRowHeaderCell) {
      const rowHeaderId: string = this.getRowHeaderId();

      cells.push(
        <RowHeaderCell
          key={rowHeaderId}
          id={rowHeaderId}
          height={rowHeight}
          isRowActive={isRowActive}
          rowIndex={rowIndex}
          width={rowHeaderWidth}
          onMouseDown={onRowHeaderMouseDown}
          onMouseEnter={onRowHeaderMouseEnter}
          onContextMenu={onRowHeaderRightClick}
          theme={theme}
        >
          {onRenderRowHeaderCell(rowIndex)}
        </RowHeaderCell>
      );
    }

    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      const cellCoordinate: GridCoordinate = new GridCoordinate(rowIndex, colIndex);
      const cellIdentifier: string = getCellIdentifier(cellCoordinate);
      const cellWidth = getCellWidth(colIndex);
      const renderedCellWidth = cellWidth - CELL_PADDING * 2; // remove left and right padding from the total width
      const style: React.CSSProperties = { padding: `${CELL_PADDING}px` };
      const cellRowSpan: number = getCellRowSpan(cellCoordinate);
      const isEditing: boolean =
        selectionState && selectionState.mode === GridMode.Edit && cellCoordinate.equals(selectionState.primaryCell);

      if (cellRowSpan > 0) {
        // If the cell is not in the mapping, render it
        const fillPosition =
          selectionState.fillSelection && selectionState.fillSelection.isCellInRegion(cellCoordinate)
            ? selectionState.fillSelection.getCellPosition(cellCoordinate, cellRowSpan)
            : null;
        const selectionPosition = GridUtilities.getCellRegionPositionIfSelected(
          cellCoordinate,
          selectionState.selections,
          cellRowSpan
        );

        // Construct the header descriptions depending on if there exists a row header
        const constructAriaDescriptionIds =
          (!!onRenderRowHeaderCell ? this.getRowHeaderId() + ' ' : '') +
          (getCellIdentifier ? getCellIdentifier(new GridCoordinate(0, colIndex, true)) : '');

        cells.push(
          <Cell
            role={PropUtils.getValueFromAccessor(getCellRole, cellCoordinate)}
            key={cellIdentifier}
            id={cellIdentifier}
            ref={`${colIndex}`}
            ariaAndDataAttributes={PropUtils.getValueFromAccessor(cellAriaAndDataAttributes, cellCoordinate)}
            className={PropUtils.getValueFromAccessor(cellClassName, cellCoordinate)}
            coordinate={cellCoordinate}
            editing={isEditing}
            fillPosition={fillPosition}
            height={rowHeight}
            isFillEnabled={isFillEnabled}
            isPrimary={cellCoordinate.equals(selectionState.primaryCell)}
            onClick={onCellClick}
            onDoubleClick={onCellDoubleClick}
            onRightClick={onCellRightClick}
            onFillMouseDown={onFillMouseDown}
            onMouseDown={onCellMouseDown}
            onMouseEnter={onCellMouseEnter}
            rowSpan={cellRowSpan}
            selectionPosition={selectionPosition}
            theme={theme}
            selectable={isCellSelectable(cellCoordinate)}
            width={cellWidth}
            dirtyCanary={dirtyCanary}
            style={style}
            isCellEditable={isCellEditable}
            ariaDescribedBy={constructAriaDescriptionIds}
          >
            {onRenderCell(cellCoordinate, renderedCellWidth)}
          </Cell>
        );
      } else {
        // Otherwise, render a spacer cell
        cells.push(
          <SpacerCell
            id={cellIdentifier}
            key={cellIdentifier}
            ref={cellIdentifier}
            coordinate={cellCoordinate}
            width={cellWidth}
          />
        );
      }
    }
    return cells;
  }
}
