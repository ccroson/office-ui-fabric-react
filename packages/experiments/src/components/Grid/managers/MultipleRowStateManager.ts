import * as _ from 'lodash';
import { GridCoordinate, GridRegion } from '../common/Common';
import { MultipleCellStateManager } from '../managers/MultipleCellStateManager';
import { SelectionState, StateManagerParameters } from '../managers/StateManager';

/**
 * This state manager should be used when you want to allow the selection of
 * multiple rows, but not individual cells
 *
 * Simply calls MultipleCellStateManager handlers and expands the resulting selections
 */
export class MultipleRowStateManager extends MultipleCellStateManager {

    /**
     * @param parameters The parameters for the state manager
     */
    constructor(parameters: StateManagerParameters) {
        super(parameters);
    }

    /**
     * Handle when the grid is first focused
     * The first row should be selected
     * @param prevState The previous selection state to transition from
     */
    public handleFocus(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleFocus(prevState));
    }

    /**
     * The Enter key should select the next row and exit Edit mode
     * @param prevState The previous selection state to transition from
     */
    public handleEnter(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleEnter(prevState));
    }

    /**
     * The Shift + Enter shortcut should select the previous row and exit Edit mode
     * @param prevState The previous selection state to transition from
     */
    public handleShiftEnter(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleShiftEnter(prevState));
    }

    /**
     * The Tab key should do nothing
     * @param prevState The previous selection state to transition from
     */
    public handleTab(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Shift + Tab shortcut should do nothing
     * @param prevState The previous selection state to transition from
     */
    public handleShiftTab(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Home key should select the first row
     * @param prevState The previous selection state to transition from
     */
    public handleHome(prevState: SelectionState): SelectionState | undefined {
        return this.handleControlHome(prevState);
    }

    /**
     * The Control + Home shortcut should select the first row
     * @param prevState The previous selection state to transition from
     */
    public handleControlHome(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleControlHome(prevState));
    }

    /**
     * The Shift + Home shortcut should select all the rows between the primary cell and the first row.
     * @param prevState The previous selection state to transition from
     */
    public handleShiftHome(prevState: SelectionState): SelectionState | undefined {
        return this.handleControlShiftHome(prevState);
    }

    /**
     * The Control + Shift + Home shortcut should move the end of the selection to the first row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftHome(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleControlShiftHome(prevState));
    }

    /**
     * The End key should select the last row
     * @param prevState The previous selection state to transition from
     */
    public handleEnd(prevState: SelectionState): SelectionState | undefined {
        return this.handleControlEnd(prevState);
    }

    /**
     * The Control + End shortcut should select the last row
     * @param prevState The previous selection state to transition from
     */
    public handleControlEnd(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleControlEnd(prevState));
    }

    /**
     * The Shift + End shortcut should select all the rows between the primary cell and the last row.
     * @param prevState The previous selection state to transition from
     */
    public handleShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return this.handleControlShiftEnd(prevState);
    }

    /**
     * The Control + Shift + End shortcut should move the end of the selection to the last row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleControlShiftEnd(prevState));
    }

    /**
     * The Left arrow key has no function
     * @param prevState The previous selection state to transition from
     */
    public handleLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleControlLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Shift + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Shift + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Shift + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Right arrow key has no function
     * @param prevState The previous selection state to transition from
     */
    public handleRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleControlRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Shift + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Shift + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Control + Shift + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Up arrow key selects the previous row
     * @param prevState The previous selection state to transition from
     */
    public handleUp(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleUp(prevState));
    }

    /**
     * The Control + Up shortcut should select the first row
     * @param prevState The previous selection state to transition from
     */
    public handleControlUp(prevState: SelectionState): SelectionState | undefined {
        return this.handleHome(prevState);
    }

    /**
     * The Shift + Up arrow key expands (or collapses) the selection to the previous row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftUp(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleShiftUp(prevState));
    }

    /**
     * The Control + Shift + Up shortcut should move the end of the selection to the first row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftUp(prevState: SelectionState): SelectionState | undefined {
        return this.handleShiftHome(prevState);
    }

    /**
     * The Down arrow key selects the next row
     * @param prevState The previous selection state to transition from
     */
    public handleDown(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleDown(prevState));
    }

    /**
     * The Control + Down shortcut should select the last row
     * @param prevState The previous selection state to transition from
     */
    public handleControlDown(prevState: SelectionState): SelectionState | undefined {
        return this.handleEnd(prevState);
    }

    /**
     * The Shift + Down shorcut expands (or collapses) the selection to the next row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftDown(prevState: SelectionState): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleShiftDown(prevState));
    }

    /**
     * The Control + Shift + Down shortcut should move the end of the selection to the last row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftDown(prevState: SelectionState): SelectionState | undefined {
        return this.handleShiftEnd(prevState);
    }

    /**
     * When a cell is pressed, we should
     * 1. Set that cell to be the primary cell
     * 2. Enter Selecting mode
     *
     * @param prevState The previous selection state to transition from
     * @param target The pressed cell
     */
    public handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleCellMouseDown(prevState, target));
    }

    /**
     * When mouse enters a cell, if the mode is Selecting, add it to the current selection
     *
     * @param prevState The previous selection state to transition from
     * @param target The moused enter cell
     */
    public handleCellMouseEnter(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleCellMouseEnter(prevState, target));
    }

    /** Handle the event when a Cell is right clicked */
    public handleCellRightClick(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleCellRightClick(prevState, target));
    }

    /** Handle the event when a mousedown occurs on a Cell with the shift key */
    public handleShiftCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleShiftCellMouseDown(prevState, target));
    }

    /** Handle the event when a mousedown occurs on a Cell with the ctrl key */
    public handleControlCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return this._wrapCellHandler(() => super.handleControlCellMouseDown(prevState, target));
    }

    /**
     * This wrapper will execute the handler function, and expand the resulting selection to be the whole rowIndex
     * @param handler The state change handler to execute
     * @param prevState The previous state to execute the handler with
     * @param target The optional target to execute the handler with
     */
    private _wrapCellHandler(handler: () => SelectionState | undefined): SelectionState | undefined {
        const cellState = handler();
        if (cellState) {
            cellState.selections = _.map(cellState.selections, (selection: GridRegion) => {
                const newSelection = this.expandToRowSelection(selection);
                newSelection.primaryCoordinate.isRowHeaderCell = true;
                return newSelection;
            });
            return cellState;
        }
    }
}
