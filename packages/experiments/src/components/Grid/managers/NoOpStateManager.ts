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
            getMappedCell: null!,
            getMaxColumnIndex: null!,
            getMaxRowIndex: null!,
            getMaxSelectableColumnIndex: null!,
            getMinSelectableColumnIndex: null!,
            getRowSpan: null!,
            isCellEditable: null!,
            isColumnSelectable: null!,
            isColumnHeaderHidden: null!
        });
    }

    public handleFocus(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleCancelKey(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleEditKey(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleKeyPress(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleEnter(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftEnter(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleTab(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftTab(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleHome(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlHome(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftHome(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftHome(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleEnd(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlEnd(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleAltShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleAltShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleDown(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftDown(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlDown(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftDown(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleUp(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlUp(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleControlShiftUp(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleShiftUp(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    public handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return;
    }

    public handleShiftCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return;
    }

    public handleControlCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return;
    }

    public handleCellMouseEnter(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return;
    }

    public handleCellRightClick(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return;
    }
}
