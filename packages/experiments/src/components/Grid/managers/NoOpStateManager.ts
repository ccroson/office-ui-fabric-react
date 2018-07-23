// OneDrive:IgnoreCodeCoverage

import { GridCoordinate } from '../common/Common';
import { StateManager, SelectionState } from '../managers/StateManager';

/**
 * This state manager ignores all events. It should be used when you
 * want to completely disable selection
 */
export class NoOpStateManager extends StateManager {
  constructor() {
    super({
      getMappedCell: null,
      getMaxColumnIndex: null,
      getMaxRowIndex: null,
      getMaxSelectableColumnIndex: null,
      getMinSelectableColumnIndex: null,
      getRowSpan: null,
      isCellEditable: null,
      isColumnSelectable: null,
      isColumnHeaderHidden: null
    });
  }

  public handleFocus(prevState: SelectionState): SelectionState {
    return;
  }

  public handleCancelKey(prevState: SelectionState): SelectionState {
    return;
  }

  public handleEditKey(prevState: SelectionState): SelectionState {
    return;
  }

  public handleKeyPress(prevState: SelectionState): SelectionState {
    return;
  }

  public handleEnter(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftEnter(prevState: SelectionState): SelectionState {
    return;
  }

  public handleTab(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftTab(prevState: SelectionState): SelectionState {
    return;
  }

  public handleHome(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlHome(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftHome(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftHome(prevState: SelectionState): SelectionState {
    return;
  }

  public handleEnd(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlEnd(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftEnd(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftEnd(prevState: SelectionState): SelectionState {
    return;
  }

  public handleLeft(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftLeft(prevState: SelectionState): SelectionState {
    return;
  }

  public handleAltShiftLeft(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlLeft(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftLeft(prevState: SelectionState): SelectionState {
    return;
  }

  public handleRight(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftRight(prevState: SelectionState): SelectionState {
    return;
  }

  public handleAltShiftRight(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlRight(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftRight(prevState: SelectionState): SelectionState {
    return;
  }

  public handleDown(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftDown(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlDown(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftDown(prevState: SelectionState): SelectionState {
    return;
  }

  public handleUp(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlUp(prevState: SelectionState): SelectionState {
    return;
  }

  public handleControlShiftUp(prevState: SelectionState): SelectionState {
    return;
  }

  public handleShiftUp(prevState: SelectionState): SelectionState {
    return;
  }

  public handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState {
    return;
  }

  public handleShiftCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState {
    return;
  }

  public handleControlCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState {
    return;
  }

  public handleCellMouseEnter(prevState: SelectionState, target: GridCoordinate): SelectionState {
    return;
  }

  public handleCellRightClick(prevState: SelectionState, target: GridCoordinate): SelectionState {
    return;
  }
}
