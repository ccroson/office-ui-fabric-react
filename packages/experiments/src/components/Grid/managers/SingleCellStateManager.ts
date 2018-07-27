import {
    GridCoordinate,
    GridMode,
    GridRegion
} from '../common/Common';

import { MultipleCellStateManager } from '../managers/MultipleCellStateManager';
import { SelectionState, StateManagerParameters } from '../managers/StateManager';

/**
 * This state manager should be used when you want to allow selection
 * of single, individual cells
 */
export class SingleCellStateManager extends MultipleCellStateManager {

    /**
     * @param parameters The parameters for the state manager
     */
    constructor(parameters: StateManagerParameters) {
        super(parameters);
    }

    /**
     * The Shift + Home shortcut should behave the same as Home
     * @param prevState The previous selection state to transition from
     */
    public handleShiftHome(prevState: SelectionState): SelectionState | undefined {
        return super.handleHome(prevState);
    }

    /**
     * The Control + Shift + Home shortcut should behave the same as Control + Home
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftHome(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlHome(prevState);
    }

    /**
     * The Shift + End shortcut should behave the same as End
     * @param prevState The previous selection state to transition from
     */
    public handleShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return super.handleEnd(prevState);
    }

    /**
     * The Control + Shift + End shortcut should behave the same as Control + End
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftEnd(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlEnd(prevState);
    }

    /**
     * The Shift + Left shortcut selects the previous cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return super.handleLeft(prevState);
    }

    /**
     * The Control + Shift + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return super.handleAltShiftLeft(prevState);
    }

    /**
     * The Control + Shift + Left shortcut selects the first cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlLeft(prevState);
    }

    /**
     * The Shift + Right shortcut selects the next cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftRight(prevState: SelectionState): SelectionState | undefined {
        return super.handleRight(prevState);
    }

    /**
     * The Control + Shift + Right shortcut selects the last cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftRight(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlRight(prevState);
    }

    /**
     * The Alt + Shift + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftRight(prevState: SelectionState): SelectionState | undefined {
        return super.handleAltShiftRight(prevState);
    }

    /**
     * The Shift + Up shortcut selects the previous cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleShiftUp(prevState: SelectionState): SelectionState | undefined {
        return super.handleUp(prevState);
    }

    /**
     * The Control + Shift + Up shortcut selects the first cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftUp(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlUp(prevState);
    }

    /**
     * The Shift + Down shortcut selects the next cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleShiftDown(prevState: SelectionState): SelectionState | undefined {
        return super.handleDown(prevState);
    }

    /**
     * The Control + Shift + Down shortcut selects the last cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftDown(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlDown(prevState);
    }

    /**
     * When a cell is pressed, select it, but go back to Select mode instead of Selecting mode
     * @param prevState The previous selection state to transition from
     * @param target The moused down cell
     */
    public handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        return {
            ...prevState,
            mode: GridMode.Select,
            primaryCell: target,
            selections: [new GridRegion(target)]
        };
    }
}
