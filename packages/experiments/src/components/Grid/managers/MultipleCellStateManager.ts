import * as _ from 'lodash';

import {
    GridCoordinate,
    GridMode,
    GridRegion
} from '../common/Common';

import {
    StateManager,
    SelectionState,
    StateManagerParameters
} from './StateManager';
import { GridUtilities } from '../utilities/GridUtilities';
import { GridConstants } from '../constants/GridConstants';

/**
 * This State manager should be used when you want to allow the selection
 * of multiple, individual cells.
 *
 * Handles common keyboard shortcuts that manipulate the selection
 */
export class MultipleCellStateManager extends StateManager {

    /**
     * @param parameters The parameters for the state manager
     */
    constructor(parameters: StateManagerParameters) {
        super(parameters);
    }

    /**
     * Handle when the grid is first focused
     * The first column header cell should be selected if column headers are visible
     * If column headers are hidden, the first grid cell should be selected
     * @param prevState The previous selection state to transition from
     */
    public handleFocus(prevState: SelectionState): SelectionState | undefined {
        const {
            mode
        } = prevState;

        if (mode === GridMode.None) {
            const minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
            if (minSelectableColumnIndex <= this.getMaxColumnIndex()) {
                const newPrimaryCell: GridCoordinate = this.isColumnHeaderHidden ?
                    new GridCoordinate(0, minSelectableColumnIndex, false) :
                    new GridCoordinate(GridConstants.HEADER_ROW_INDEX, minSelectableColumnIndex, true);

                return {
                    ...prevState,
                    mode: GridMode.Select,
                    primaryCell: newPrimaryCell,
                    selections: [new GridRegion(newPrimaryCell)]
                };
            }
        }
    }

    /**
     * The Enter key should select the next cell in the column.
     * If the cell was in Edit mode, exit Edit mode
     * @param prevState The previous selection state to transition from
     */
    public handleEnter(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if ((mode === GridMode.Select || mode === GridMode.Edit) && primaryCell) {
            const rowSpan = this.getRowSpan(primaryCell);
            if (primaryCell.rowIndex + (rowSpan - 1) < this.getMaxRowIndex()) {
                const newPrimaryCell: GridCoordinate = new GridCoordinate(primaryCell.rowIndex + rowSpan, primaryCell.columnIndex);
                return {
                    ...prevState,
                    mode: GridMode.Select,
                    primaryCell: newPrimaryCell,
                    selections: [new GridRegion(newPrimaryCell)]
                };
            } else if (mode === GridMode.Edit) {
                return {
                    ...prevState,
                    mode: GridMode.Select
                };
            }
        }
    }

    /**
     * The Shift + Enter shorcut should select the previous cell in the column
     * If the cell was in Edit mode, exit Edit mode.
     * @param prevState The previous selection state to transition from
     */
    public handleShiftEnter(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select || mode === GridMode.Edit) {
            if (primaryCell && primaryCell.rowIndex > 0) {
                const newPrimaryCell: GridCoordinate = this.getMappedCell(
                    new GridCoordinate(primaryCell.rowIndex - 1, primaryCell.columnIndex)
                );

                return {
                    ...prevState,
                    mode: GridMode.Select,
                    primaryCell: newPrimaryCell,
                    selections: [new GridRegion(newPrimaryCell)]
                };
            } else if (mode === GridMode.Edit) {
                return {
                    ...prevState,
                    mode: GridMode.Select
                };
            }
        }
    }

    /**
     * The Tab key should select the next cell in the row
     * If the cell was in Edit mode, exit Edit mode
     * @param prevState The previous selection state to transition from
     */
    public handleTab(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if ((mode === GridMode.Select || mode === GridMode.Edit) && primaryCell) {
            const newPrimaryCell = this.getNextTabCell(primaryCell)!;
            return this._handleTabHelper(prevState, newPrimaryCell);
        }
    }

    /**
     * The Shift + Tab shortcut should select the previous cell in the row
     * If the cell was in Edit mode, exit Edit mode
     * @param prevState The previous selection state to transition from
     */
    public handleShiftTab(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if ((mode === GridMode.Select || mode === GridMode.Edit) && primaryCell) {
            const newPrimaryCell = this.getPreviousTabCell(primaryCell)!;
            return this._handleTabHelper(prevState, newPrimaryCell);
        }
    }

    /**
     * The Home key should select the first selectable cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleHome(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1 && primaryCell) {
            const minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
            if (minSelectableColumnIndex !== -1) {
                const selection: GridRegion = this._getPrimarySelection(prevState)!;
                const alreadyHome: boolean = primaryCell.columnIndex === minSelectableColumnIndex;
                if (!alreadyHome || !selection.isSingleCell()) {
                    const newPrimaryCell: GridCoordinate = this.getMappedCell(
                        new GridCoordinate(primaryCell.rowIndex, minSelectableColumnIndex, primaryCell.isColumnHeaderCell)
                    );

                    return {
                        ...prevState,
                        primaryCell: newPrimaryCell,
                        selections: [new GridRegion(newPrimaryCell)]
                    };
                }
            }
        }
    }

    /**
     * The Control + Home shortcut should select the first selectable cell in the Grid
     * @param prevState The previous selection state to transition from
     */
    public handleControlHome(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1 && primaryCell) {
            const minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
            if (minSelectableColumnIndex !== -1) {
                const selection: GridRegion = this._getPrimarySelection(prevState)!;
                const alreadyHome: boolean = primaryCell.rowIndex === 0 && primaryCell.columnIndex === minSelectableColumnIndex;
                if (!alreadyHome || !selection.isSingleCell()) {
                    const newPrimaryCell: GridCoordinate = new GridCoordinate(0, minSelectableColumnIndex);
                    return {
                        ...prevState,
                        primaryCell: newPrimaryCell,
                        selections: [new GridRegion(newPrimaryCell)]
                    };
                }
            }
        }
    }

    /**
     * The Shift + Home shortcut should select all the cells from the primary cell to the first
     * selectable cell in the row.
     * @param prevState The previous selection state to transition from
     */
    public handleShiftHome(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            if (minSelectableColumnIndex !== -1 && selection.secondaryCoordinate.columnIndex !== minSelectableColumnIndex) {
                const newSecondaryCoordinate: GridCoordinate =
                    new GridCoordinate(selection.secondaryCoordinate.rowIndex, minSelectableColumnIndex);

                const newSelection: GridRegion = this.getRectangularSelection(
                    new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Shift + Home should move the end of the selection to the first cell
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftHome(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const minSelectableColumnIndex: number = this.getMinSelectableColumnIndex();
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const secondaryCoordinate: GridCoordinate = selection.secondaryCoordinate;
            if (minSelectableColumnIndex !== -1 && (secondaryCoordinate.rowIndex !== 0 ||
                secondaryCoordinate.columnIndex !== minSelectableColumnIndex)) {
                    const newSecondaryCoordinate: GridCoordinate = new GridCoordinate(0, minSelectableColumnIndex);
                    const newSelection: GridRegion = this.getRectangularSelection(
                        new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                    );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The End key should select the last selectable cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleEnd(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1 && primaryCell) {
            const maxSelectableColumnIndex: number = this.getMaxSelectableColumnIndex();
            if (maxSelectableColumnIndex !== -1) {
                const alreadyEnd: boolean = primaryCell.columnIndex === maxSelectableColumnIndex;
                const selection: GridRegion = this._getPrimarySelection(prevState)!;
                if (!alreadyEnd || !selection.isSingleCell()) {
                    const newPrimaryCell: GridCoordinate = this.getMappedCell(
                        new GridCoordinate(primaryCell.rowIndex, maxSelectableColumnIndex, primaryCell.isColumnHeaderCell)
                    );

                    return {
                        ...prevState,
                        primaryCell: newPrimaryCell,
                        selections: [new GridRegion(newPrimaryCell)]
                    };
                }
            }
        }
    }

    /**
     * The Control + End shortcut should select the last selectable cell in the Grid
     * @param prevState The previous selection state to transition from
     */
    public handleControlEnd(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1 && primaryCell) {
            const maxSelectableColumnIndex: number = this.getMaxSelectableColumnIndex();
            if (maxSelectableColumnIndex !== -1) {
                const maxRowIndex: number = this.getMaxRowIndex();
                const alreadyEnd: boolean = primaryCell.rowIndex === maxRowIndex && primaryCell.columnIndex === maxSelectableColumnIndex;
                const selection: GridRegion = this._getPrimarySelection(prevState)!;

                if (!alreadyEnd || !selection.isSingleCell()) {
                    const newPrimaryCell: GridCoordinate = this.getMappedCell(
                        new GridCoordinate(maxRowIndex, maxSelectableColumnIndex)
                    );

                    return {
                        ...prevState,
                        primaryCell: newPrimaryCell,
                        selections: [new GridRegion(newPrimaryCell)]
                    };
                }
            }
        }
    }

    /**
     * The Shift + End shortcut should select all the cells between the primary cell and the last
     * selectable cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleShiftEnd(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const maxSelectableColumnIndex: number = this.getMaxSelectableColumnIndex();
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const secondaryCoordinate: GridCoordinate = selection.secondaryCoordinate;

            if (maxSelectableColumnIndex !== -1 && secondaryCoordinate.columnIndex !== maxSelectableColumnIndex) {
                const newSecondaryCoordinate: GridCoordinate = new
                 GridCoordinate(selection.secondaryCoordinate.rowIndex, maxSelectableColumnIndex);
                const newSelection: GridRegion = this.getRectangularSelection(
                    new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Shift + End should move the end of the selection to the last cell
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftEnd(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const maxRowIndex: number = this.getMaxRowIndex();
            const maxSelectableColumnIndex: number = this.getMaxSelectableColumnIndex();
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const secondaryCoordinate: GridCoordinate = selection.secondaryCoordinate;

            if (maxSelectableColumnIndex !== -1 && (secondaryCoordinate.rowIndex !== maxRowIndex ||
                secondaryCoordinate.columnIndex !== maxSelectableColumnIndex)) {
                    const newSecondaryCoordinate: GridCoordinate = new GridCoordinate(maxRowIndex, maxSelectableColumnIndex);
                    const newSelection: GridRegion = this.getRectangularSelection(
                        new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                    );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Left arrow key should select the previous cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleLeft(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            const newPrimaryCell = this.getPreviousTabCell(primaryCell);

            if (newPrimaryCell) {
                const newSelection = new GridRegion(newPrimaryCell);
                return {
                    ...prevState,
                    primaryCell: newPrimaryCell,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Left shortcut should behave the same as the Home shortcut
     * @param prevState The previous selection state to transition from
     */
    public handleControlLeft(prevState: SelectionState): SelectionState | undefined {
        return this.handleHome(prevState);
    }

    /**
     * The Shift + Left shortcut should expand (or collapse) the selection in the Left direction
     * @param prevState The previous selection state to transition from
     */
    public handleShiftLeft(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            if (selection.secondaryCoordinate.columnIndex > 0 &&
                this.isColumnSelectable(selection.secondaryCoordinate.columnIndex - 1)) {
                const newSecondaryCoordinate: GridCoordinate = new
                GridCoordinate(selection.secondaryCoordinate.rowIndex, selection.secondaryCoordinate.columnIndex - 1);
                const newSelection: GridRegion = this.getRectangularSelection(
                    new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Shift + Left shortcut should behave the same as the Shift + Home shortcut
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return this.handleShiftHome(prevState);
    }

    /**
     * The Control + Shift + Left shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftLeft(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Right arrow key should select the next cell in the row
     * @param prevState The previous selection state to transition from
     */
    public handleRight(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            const newPrimaryCell = this.getNextTabCell(primaryCell);

            if (newPrimaryCell) {
                const newSelection = new GridRegion(newPrimaryCell);
                return {
                    ...prevState,
                    primaryCell: newPrimaryCell,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Right shortcut should behave the same as the End shortcut
     * @param prevState The previous selection state to transition from
     */
    public handleControlRight(prevState: SelectionState): SelectionState | undefined {
        return this.handleEnd(prevState);
    }

    /**
     * The Control + Shift + Right shortcut should behave the same as the Shift + End shortcut
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftRight(prevState: SelectionState): SelectionState | undefined {
        return this.handleShiftEnd(prevState);
    }

    /**
     * The Control + Shift + Right shortcut has no function
     * @param prevState The previous selection state to transition from
     */
    public handleAltShiftRight(prevState: SelectionState): SelectionState | undefined {
        return;
    }

    /**
     * The Shift + Right shortcut should expand (or collapse) the selection in the Right direction
     * @param prevState The previous selection state to transition from
     */
    public handleShiftRight(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            if (selection.secondaryCoordinate.columnIndex < this.getMaxColumnIndex() &&
                this.isColumnSelectable(selection.secondaryCoordinate.columnIndex + 1)) {
                    const newSecondaryCoordinate: GridCoordinate = new
                    GridCoordinate(selection.secondaryCoordinate.rowIndex, selection.secondaryCoordinate.columnIndex + 1);
                        const newSelection: GridRegion = this.getRectangularSelection(
                            new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate)
                        );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Down key should select the next cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleDown(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            const rowSpan = this.getRowSpan(primaryCell);
            if (primaryCell.rowIndex + (rowSpan - 1) < this.getMaxRowIndex()) {
                const newPrimaryCell: GridCoordinate = new GridCoordinate(primaryCell.rowIndex + rowSpan, primaryCell.columnIndex);
                const newSelection: GridRegion = new GridRegion(newPrimaryCell);

                return {
                    ...prevState,
                    primaryCell: newPrimaryCell,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Down shortcut should select the last cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleControlDown(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            const maxRowIndex = this.getMaxRowIndex();
            const rowSpan = this.getRowSpan(primaryCell);
            if (primaryCell.rowIndex + (rowSpan - 1) !== maxRowIndex) {
                const newPrimaryCell: GridCoordinate = this.getMappedCell(
                    new GridCoordinate(maxRowIndex, primaryCell.columnIndex)
                );

                const newSelection: GridRegion = new GridRegion(newPrimaryCell);
                return {
                    ...prevState,
                    primaryCell: newPrimaryCell,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Shift + Down shortcut should expand (or collapse) the selection in the Down direction
     * @param prevState The previous selection state to transition from
     */
    public handleShiftDown(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1 && prevState.primaryCell && !prevState.primaryCell.isColumnHeaderCell) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            if (selection.secondaryCoordinate.rowIndex < this.getMaxRowIndex()) {
                const newSecondaryCoordinate: GridCoordinate = new
                GridCoordinate(selection.secondaryCoordinate.rowIndex + 1, selection.secondaryCoordinate.columnIndex);
                    let newSelection: GridRegion = new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate);
                    newSelection = this.getRectangularSelection(
                        newSelection,
                        newSelection.rowRange.start !== newSelection.secondaryCoordinate.rowIndex
                    );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Shift + Down shortcut should move the end of the selection to the last cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftDown(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const maxRowIndex = this.getMaxRowIndex();
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const secondaryCoordinate: GridCoordinate = selection.secondaryCoordinate;
            const rowSpan = this.getRowSpan(secondaryCoordinate);
            if (secondaryCoordinate.rowIndex + (rowSpan - 1) !== maxRowIndex) {
                const newSecondaryCoordinate: GridCoordinate = new GridCoordinate(maxRowIndex, secondaryCoordinate.columnIndex);
                const newSelection: GridRegion = new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate);
                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Up arrow key should select the previous cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleUp(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            let newPrimaryCell: GridCoordinate = primaryCell;
            let newSelection: GridRegion;

            if (primaryCell.rowIndex === 0) {
                newPrimaryCell = this.getMappedCell(
                    new GridCoordinate(primaryCell.rowIndex - 1, primaryCell.columnIndex, true)
                );
            } else if (primaryCell.rowIndex > 0) {
                newPrimaryCell = this.getMappedCell(
                    new GridCoordinate(primaryCell.rowIndex - 1, primaryCell.columnIndex));
            } else {
                return; // No action
            }

            newSelection = new GridRegion(newPrimaryCell);

            return {
                ...prevState,
                primaryCell: newPrimaryCell,
                selections: [newSelection]
            };
        }
    }

    /**
     * The Control + Up shortcut should select the first cell in the current column
     * @param prevState The previous selection state to transition from
     */
    public handleControlUp(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (mode === GridMode.Select && primaryCell) {
            if (primaryCell.rowIndex !== 0) {
                const newPrimaryCell: GridCoordinate = new GridCoordinate(0, primaryCell.columnIndex);
                const newSelection: GridRegion = new GridRegion(newPrimaryCell);

                return {
                    ...prevState,
                    primaryCell: newPrimaryCell,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Shift + Up shortcut should expand (or collapse) the selection in the Up direction
     * @param prevState The previous selection state to transition from
     */
    public handleShiftUp(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            if (selection.secondaryCoordinate.rowIndex > 0) {
                const newSecondaryCoordinate: GridCoordinate = new
                GridCoordinate(selection.secondaryCoordinate.rowIndex - 1, selection.secondaryCoordinate.columnIndex);
                    let newSelection: GridRegion = new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate);
                    newSelection = this.getRectangularSelection(
                        newSelection,
                        newSelection.rowRange.end !== newSelection.secondaryCoordinate.rowIndex
                    );

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
    }

    /**
     * The Control + Shift + Down shortcut should move the end of the selection to the last cell in the column
     * @param prevState The previous selection state to transition from
     */
    public handleControlShiftUp(prevState: SelectionState): SelectionState | undefined {
        const {
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Select && selections.length === 1) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const secondaryCoordinate: GridCoordinate = selection.secondaryCoordinate;
            if (secondaryCoordinate.rowIndex !== 0) {
                const newSecondaryCoordinate: GridCoordinate = new GridCoordinate(0, secondaryCoordinate.columnIndex);
                const newSelection: GridRegion = new GridRegion(selection.primaryCoordinate, newSecondaryCoordinate);

                return {
                    ...prevState,
                    selections: [newSelection]
                };
            }
        }
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
        let newPrimaryCell: GridCoordinate;
        let mode: GridMode;

        if (target.isColumnHeaderCell) {
            newPrimaryCell = this.getMappedCell(
                new GridCoordinate(target.rowIndex - 1, target.columnIndex, true)
            );

            mode = GridMode.Select;
        } else if (target.isRowHeaderCell) {
            newPrimaryCell = this.getMappedCell(
                new GridCoordinate(target.rowIndex, target.columnIndex, false, true)
            );

            mode = GridMode.Selecting;
        } else if (this.isColumnSelectable(target.columnIndex)) {
            newPrimaryCell = this.getMappedCell(
                new GridCoordinate(target.rowIndex, target.columnIndex)
            );

            mode = GridMode.Selecting;
        } else {
            return; // No action
        }

        return {
            ...prevState,
            mode: mode,
            primaryCell: newPrimaryCell,
            selections: [new GridRegion(newPrimaryCell)]
        };
    }

    /**
     * Handle the event when a mousedown occurs on a Cell with the shift key
     * @param prevState The previous selection state to transition from
     * @param target The pressed cell
     */
    public handleShiftCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        const {
            mode
        } = prevState;

        if (this.isColumnSelectable(target.columnIndex) && mode !== GridMode.None) {
            const updatedSelections = this._expandPrimarySelection(prevState, target);
            if (updatedSelections) {
                return {
                    ...prevState,
                    mode: GridMode.Selecting,
                    selections: updatedSelections
                };
            }
        }
    }

    /**
     * Handle the event when a mousedown occurs on a Cell with the ctrl key
     * @param prevState The previous selection state to transition from
     * @param target The pressed cell
     */
    public handleControlCellMouseDown(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        const {
            selections
        } = prevState;

        if (this.isColumnSelectable(target.columnIndex)) {

            const newSelections: GridRegion[] = [...selections];
            // if clicked outside, add another region
            if (!GridUtilities.isCellInsideAnySelection(target, selections)) {
                newSelections.push(new GridRegion(target));
            }

            return {
                ...prevState,
                mode: GridMode.Selecting,
                primaryCell: target,
                selections: newSelections
            };
        }
    }

    /**
     * When mouse enters a cell, if the mode is Selecting, add it to the current selection
     *
     * @param prevState The previous selection state to transition from
     * @param target The moused enter cell
     */
    public handleCellMouseEnter(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        const {
            fillSelection,
            mode,
            selections
        } = prevState;

        if (mode === GridMode.Selecting) {
            if (this.isColumnSelectable(target.columnIndex)) {

                const updatedSelections = this._expandPrimarySelection(prevState, target);
                if (updatedSelections) {
                    return {
                        ...prevState,
                        selections: updatedSelections
                    };
                }
            }
        } else if (mode === GridMode.Filling && selections.length === 1) {
            const selection: GridRegion = this._getPrimarySelection(prevState)!;
            const newFillSelection = selection.getFillRegion(target);
            // if newFillSelection is null and fillSelection is not, we need to set the fillSelection to null
            if (newFillSelection !== fillSelection || (newFillSelection && !newFillSelection.equals(fillSelection))) {
                return {
                    ...prevState,
                    fillSelection: newFillSelection
                };
            }
        }
    }

    /** Handle the event when a Cell is right clicked */
    public handleCellRightClick(prevState: SelectionState, target: GridCoordinate): SelectionState | undefined {
        const {
            mode,
            primaryCell
        } = prevState;

        if (
            (mode === GridMode.None || mode === GridMode.Select || mode === GridMode.Edit)
            && !target.equals(primaryCell)
            && this.isColumnSelectable(target.columnIndex)
        ) {
            return {
                ...prevState,
                primaryCell: target,
                mode: GridMode.Select,
                selections: [new GridRegion(target)]
            };
        }
    }

    private _handleTabHelper(prevState: SelectionState, newPrimaryCell: GridCoordinate): SelectionState | undefined {
        if (newPrimaryCell) {
            return {
                ...prevState,
                mode: GridMode.Select,
                primaryCell: newPrimaryCell,
                selections: [new GridRegion(newPrimaryCell)]
            };
        } else if (prevState.mode === GridMode.Edit) {
            return {
                ...prevState,
                mode: GridMode.Select
            };
        }
    }

    private _getPrimarySelection(selectionState: SelectionState): GridRegion | undefined {
        const {
            primaryCell,
            selections
        } = selectionState;

        if (primaryCell)
            return _.find(selections, (selection: GridRegion) => selection.isCellInRegion(primaryCell));
    }

    /**
     * Method to expand the primary selection to the given target
     * @param prevState The previous selection state to transition from
     * @param target The target cell
     * @returns an array of new selection, if there is no overlap, otherwise retuns null
     */
    private _expandPrimarySelection(prevState: SelectionState, target: GridCoordinate): GridRegion[] | null {
        const {
            primaryCell,
            selections
        } = prevState;

        // If this cell is mapped, get the mapped cell
        target = this.getMappedCell(target);

        if (!primaryCell)
            return null;
        const newSelection: GridRegion = this.getRectangularSelection(
            new GridRegion(primaryCell, target)
        );

        // if the new selection causes overlap, ignore it, we don't want to have overlapping selections.
        const nonPrimarySelections: GridRegion[] = _.filter(selections, (selection: GridRegion) => !selection.isCellInRegion(primaryCell));
        let updateSelection = true;
        _.forEach(nonPrimarySelections, (selection: GridRegion) => {
            if (selection.isOverlapping(newSelection)) {
                updateSelection = false;
            }
        });

        if (updateSelection) {
            return [...nonPrimarySelections, newSelection];
        } else {
            return null;
        }
    }
}
