import { GridCoordinate, GridMode, GridRegion } from '../common/Common';
import { GridConstants } from '../constants/GridConstants';

/** Parameters for all State Managers */
export type StateManagerParameters = {
  /**
   * A delegate that returns the mapped cell for given a cell.
   * In case of empty rowspanned cells, it returns the corresponding cell having a rowspan > 1
   */
  getMappedCell: (cell: GridCoordinate) => GridCoordinate;
  /** The accessor for the first selectable column */
  getMinSelectableColumnIndex: () => number;
  /** The accessor for the last selectable column */
  getMaxSelectableColumnIndex: () => number;
  /** The accessor for the last column index */
  getMaxColumnIndex: () => number;
  /** The accessor for the last row index */
  getMaxRowIndex: () => number;
  /** The accessor for the row span of a cell */
  getRowSpan: (cell: GridCoordinate) => number;
  /** The accessor to determine if a cell is editable */
  isCellEditable: (cell: GridCoordinate) => boolean;
  /** The accessor to determine if a column is selectable */
  isColumnSelectable: (columnIndex: number) => boolean;
  /** The accessor to determine if column headers are hidden */
  isColumnHeaderHidden: boolean;
};

/**
 * Type encapsulating the selection state of a Grid
 */
export type SelectionState = {
  /** The current fill selection, or null if not present */
  fillSelection: GridRegion;

  /** The current selections, or empty if not present */
  selections: GridRegion[];

  /** The current primary cell, or (-1, -1) if not preset */
  primaryCell: GridCoordinate;

  /** The current GridMode */
  mode: GridMode;
};

/**
 * Class for managing the selection state of the Grid
 * Contains handlers that take a previous SelectionState and returns the new state if a transition
 * should be made
 */
export abstract class StateManager {
  /**
   * A delegate that returns the mapped cell for given a cell.
   * In case of empty rowspanned cells, it returns the corresponding cell having a rowspan > 1
   */
  protected getMappedCell: (cell: GridCoordinate) => GridCoordinate;

  /** An accessor for the first selectable column */
  protected getMinSelectableColumnIndex: () => number;

  /** An accessor for the last selectable column */
  protected getMaxSelectableColumnIndex: () => number;

  /** An accessor for the last column index */
  protected getMaxColumnIndex: () => number;

  /** An accessor for the last row index */
  protected getMaxRowIndex: () => number;

  /** An accessor for the row span of a cell */
  protected getRowSpan: (cell: GridCoordinate) => number;

  /** An accessor to determine if a cell is editable */
  protected isCellEditable: (cell: GridCoordinate) => boolean;

  /** An accessor to determine if a column is selectable */
  protected isColumnSelectable: (columnIndex: number) => boolean;

  /** The accessor to determine if column headers are hidden */
  protected isColumnHeaderHidden: boolean;

  /**
   * @param parameters Parameters for the manager
   */
  constructor(parameters: StateManagerParameters) {
    this.getMappedCell = parameters.getMappedCell;
    this.getMinSelectableColumnIndex = parameters.getMinSelectableColumnIndex;
    this.getMaxSelectableColumnIndex = parameters.getMaxSelectableColumnIndex;
    this.getMaxColumnIndex = parameters.getMaxColumnIndex;
    this.getMaxRowIndex = parameters.getMaxRowIndex;
    this.getRowSpan = parameters.getRowSpan;
    this.isCellEditable = parameters.isCellEditable;
    this.isColumnSelectable = parameters.isColumnSelectable;
    this.isColumnHeaderHidden = parameters.isColumnHeaderHidden;
  }

  /**
   * Handle the cancel key
   * In all modes, cancel exits Edit mode
   * @param prevState The previous selection state to transition from
   */
  public handleCancelKey(prevState: SelectionState): SelectionState {
    const { mode } = prevState;

    if (mode === GridMode.Edit) {
      return {
        ...prevState,
        mode: GridMode.Select
      };
    }
  }

  /**
   * Handle the edit key
   * In all modes, the edit key enters Edit mode if the cell is editable
   * @param prevState The previous selection state to transition from
   */
  public handleEditKey(prevState: SelectionState): SelectionState {
    const { mode, primaryCell } = prevState;

    if (mode === GridMode.Select && this.isCellEditable(primaryCell)) {
      return {
        ...prevState,
        selections: [new GridRegion(primaryCell)],
        mode: GridMode.Edit
      };
    }
  }

  /**
   * Handle a character press event
   * In all modes, this enters Edit mode if the cell is editable
   * @param prevState The previous selection state to transition from
   */
  public handleKeyPress(prevState: SelectionState): SelectionState {
    const { mode, primaryCell } = prevState;

    if (mode === GridMode.Select && this.isCellEditable(primaryCell)) {
      return {
        ...prevState,
        mode: GridMode.Edit
      };
    }
  }

  /**
   * Handle a mouse up event
   * In Selecting Mode, should enter Select mode if the drag selection has changed or Edit mode if it has not
   * @param prevState The previous selection state to transition from
   * @param transitionToEditModeAfterSelecting Flag to set the grid to Edit mode after Selecting
   */
  public handleCellMouseUp(prevState: SelectionState, transitionToEditModeAfterSelecting: boolean): SelectionState {
    const { mode, primaryCell } = prevState;

    if (mode === GridMode.Selecting) {
      if (transitionToEditModeAfterSelecting && this.isCellEditable(primaryCell)) {
        return {
          ...prevState,
          mode: GridMode.Edit
        };
      } else {
        return {
          ...prevState,
          mode: GridMode.Select
        };
      }
    }
  }

  /**
   * Handle the event when the fill handle is first pressed
   * Will always enter Filling mode
   */
  public handleFillMouseDown(prevState: SelectionState): SelectionState {
    const { mode } = prevState;

    if (mode !== GridMode.Selecting && mode !== GridMode.Filling) {
      return {
        ...prevState,
        mode: GridMode.Filling
      };
    }
  }

  /**
   * Handle the event when the fill handle is released
   * Will exit Filling mode and merge the selection and the fillSelection if applicable
   */
  public handleFillMouseUp(prevState: SelectionState): SelectionState {
    const { fillSelection, mode, selections } = prevState;

    if (mode === GridMode.Filling && selections.length === 1) {
      if (fillSelection) {
        return {
          ...prevState,
          fillSelection: null,
          mode: GridMode.Select,
          selections: [selections[0].merge(fillSelection)]
        };
      } else {
        return {
          ...prevState,
          mode: GridMode.Select
        };
      }
    }
  }

  /** Handle when the grid is first focused */
  public abstract handleFocus(prevState: SelectionState): SelectionState;

  /** Handle the Enter key */
  public abstract handleEnter(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Enter shortcut */
  public abstract handleShiftEnter(prevState: SelectionState): SelectionState;

  /** Handle the Tab key */
  public abstract handleTab(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Tab shortcut */
  public abstract handleShiftTab(prevState: SelectionState): SelectionState;

  /** Handle the Home key */
  public abstract handleHome(prevState: SelectionState): SelectionState;

  /** Handle the Control + Home shortcut */
  public abstract handleControlHome(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Home shortcut */
  public abstract handleShiftHome(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Home shortcut */
  public abstract handleControlShiftHome(prevState: SelectionState): SelectionState;

  /** Handle the End key */
  public abstract handleEnd(prevState: SelectionState): SelectionState;

  /** Handle the Control + End shortcut */
  public abstract handleControlEnd(prevState: SelectionState): SelectionState;

  /** Handle the Shift + End shortcut */
  public abstract handleShiftEnd(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Home shortcut */
  public abstract handleControlShiftEnd(prevState: SelectionState): SelectionState;

  /** Handle the Left arrow key */
  public abstract handleLeft(prevState: SelectionState): SelectionState;

  /** Handle the Control + Left shortcut */
  public abstract handleControlLeft(prevState: SelectionState): SelectionState;

  /** Handle the Alt + Shift + Left shortcut */
  public abstract handleAltShiftLeft(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Left shortcut */
  public abstract handleShiftLeft(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Left shortcut */
  public abstract handleControlShiftLeft(prevState: SelectionState): SelectionState;

  /** Handle the Right arrow key */
  public abstract handleRight(prevState: SelectionState): SelectionState;

  /** Handle the Control + Right shortcut */
  public abstract handleControlRight(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Right shortcut */
  public abstract handleShiftRight(prevState: SelectionState): SelectionState;

  /** Handle the Alt + Shift + Right shortcut */
  public abstract handleAltShiftRight(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Right shortcut */
  public abstract handleControlShiftRight(prevState: SelectionState): SelectionState;

  /** Handle the Down arrow key */
  public abstract handleDown(prevState: SelectionState): SelectionState;

  /** Handle the Control + Down shortcut */
  public abstract handleControlDown(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Down shortcut */
  public abstract handleShiftDown(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Down shortcut */
  public abstract handleControlShiftDown(prevState: SelectionState): SelectionState;

  /** Handle the Up arrow key */
  public abstract handleUp(prevState: SelectionState): SelectionState;

  /** Handle the Control + Up shortcut */
  public abstract handleControlUp(prevState: SelectionState): SelectionState;

  /** Handle the Shift + Up arrow key */
  public abstract handleShiftUp(prevState: SelectionState): SelectionState;

  /** Handle the Control + Shift + Up shortcut */
  public abstract handleControlShiftUp(prevState: SelectionState): SelectionState;

  /** Handle the event when a mousedown occurs on a Cell */
  public abstract handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState;

  /** Handle the event when a mousedown occurs on a Cell with the shift key */
  public abstract handleShiftCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState;

  /** Handle the event when a mousedown occurs on a Cell with the ctrl key */
  public abstract handleControlCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState;

  /** Handle the event when a Cell is moused enter */
  public abstract handleCellMouseEnter(prevState: SelectionState, target: GridCoordinate): SelectionState;

  /** Handle the event when a Cell is right clicked */
  public abstract handleCellRightClick(prevState: SelectionState, target: GridCoordinate): SelectionState;

  /**
   * Given a selection, expand it to select entire rows
   * @param selection The selection to expand
   */
  protected expandToRowSelection(selection: GridRegion): GridRegion {
    let minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
    let maxSelectableColumnIndex: number = this.getMaxSelectableColumnIndex();
    if (minSelectableColumnIndex <= this.getMaxColumnIndex() && maxSelectableColumnIndex >= 0) {
      // create a new region using min,max selectable column and the primary,secondary coordinates from the original region
      return new GridRegion(
        new GridCoordinate(selection.primaryCoordinate.rowIndex, minSelectableColumnIndex),
        new GridCoordinate(selection.secondaryCoordinate.rowIndex, maxSelectableColumnIndex)
      );
    }

    return selection;
  }

  /**
   * Get a rectangular selection from a potentially partial selection
   * @param selection The selection to modify
   * @param expand Should we expand to get rectangular selection
   */
  protected getRectangularSelection(selection: GridRegion, expand: boolean = true): GridRegion {
    selection.fillPartialCells(this.getRowSpan, this.getMappedCell, expand);
    return selection;
  }

  /**
   * Get the next cell in the tab index. Returns the same cell if the cell is the last cell
   * @param cell The current cell
   */
  protected getNextTabCell(cell: GridCoordinate): GridCoordinate {
    const minSelectableColumnIndex = this.getMinSelectableColumnIndex();
    const maxSelectableColumnIndex = this.getMaxSelectableColumnIndex();
    const maxRowIndex = this.getMaxRowIndex();

    let newCell: GridCoordinate;
    if (cell.isColumnHeaderCell) {
      if (cell.columnIndex !== maxSelectableColumnIndex) {
        newCell = new GridCoordinate(GridConstants.HEADER_ROW_INDEX, cell.columnIndex + 1, true);
      } else {
        newCell = new GridCoordinate(0, minSelectableColumnIndex);
      }
    } else {
      if (cell.columnIndex === maxSelectableColumnIndex && cell.rowIndex < maxRowIndex) {
        newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex + 1, minSelectableColumnIndex));
      } else if (cell.columnIndex < maxSelectableColumnIndex) {
        newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex, cell.columnIndex + 1));
      }
    }
    return newCell;
  }

  /**
   * Get the previous cell in the tab index. Returns undefined if the cell is the first cell
   * @param cell The current cell
   */
  protected getPreviousTabCell(cell: GridCoordinate): GridCoordinate {
    const minSelectableColumnIndex = this.getMinSelectableColumnIndex();
    const maxSelectableColumnIndex = this.getMaxSelectableColumnIndex();
    const minRowIndex = 0;

    let newCell: GridCoordinate;

    if (cell.isColumnHeaderCell) {
      if (cell.columnIndex > minSelectableColumnIndex) {
        newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex, cell.columnIndex - 1, true));
      }
    } else {
      if (cell.rowIndex === minRowIndex) {
        if (cell.columnIndex === minSelectableColumnIndex) {
          newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex - 1, maxSelectableColumnIndex, true));
        } else {
          newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex, cell.columnIndex - 1));
        }
      } else if (cell.rowIndex > minRowIndex) {
        if (cell.columnIndex === minSelectableColumnIndex) {
          newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex - 1, maxSelectableColumnIndex));
        } else {
          newCell = this.getMappedCell(new GridCoordinate(cell.rowIndex, cell.columnIndex - 1));
        }
      }
    }
    return newCell;
  }
}
