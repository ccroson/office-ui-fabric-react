import { GridCoordinate, GridMode } from '../common/Common';
import { MultipleRowStateManager } from './MultipleRowStateManager';
import { SelectionState, StateManagerParameters } from './StateManager';

/**
 * This state manager should be used when you want to allow selection
 * of single rows
 */
export class SingleRowStateManager extends MultipleRowStateManager {

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
     * The Shift + Left shortcut should behave the same as Left
     * @param prevState The previous selection state to transition from
     */
    public handleShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return super.handleLeft(prevState);
    }

    /**
     * The Control + Shift + Left shortcut should behave the same as Control + Left
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlLeft(prevState);
    }

    /**
     * The Shift + right shortcut should behave the same as Right
     * @param prevState The previous selection state to transition from
     */
    public handleShiftRight(prevState: SelectionState): SelectionState | undefined {
        return super.handleRight(prevState);
    }

    /**
     * The Control + Shift + Right shortcut should behave the same as Control + Right
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftRight(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlRight(prevState);
    }

    /**
     * The Shift + Up shortcut should select the previous row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftUp(prevState: SelectionState): SelectionState | undefined {
        return super.handleUp(prevState);
    }

    /**
     * The Control + Shift + Up shortcut should select the first row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftUp(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlUp(prevState);
    }

    /**
     * The Shift + Down shortcut should select the next row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftDown(prevState: SelectionState): SelectionState | undefined {
        return super.handleDown(prevState);
    }

    /**
     * The Control + Shift + Down shortcut should select the last row
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftDown(prevState: SelectionState): SelectionState | undefined {
        return super.handleControlDown(prevState);
    }

    /**
     * When a cell is pressed, select the row, but go back to Select mode instead of Selecting mode
     * @param prevState The previous selection state to transition from
     * @param target The moused down cell
     */
    public handleCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        const newState = super.handleCellMouseDown(prevState, target);
        if (newState) {
            newState.mode = GridMode.Select;
            return newState;
        }
    }
}
