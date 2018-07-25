import './List.scss';
import * as React from 'react';
import * as _ from 'lodash';

// Components
import {
    AbstractGrid,
    CellContext,
    ContentAlignment,
    IAbstractGridProps,
    IAbstractGridState,
    IColumnDefinition,
    ICellDefinition,
    ICellType,
    IHeaderDefinition
} from '../common/AbstractGrid';
import { SelectionCell } from '../types/SelectionCell';

// Constants
import { GridConstants, GridDefaultProps } from '../constants/GridConstants';
import { GridThemes } from '../base/Themes';

// Models
import { GridCoordinate, GridMode, GridRegion, GridTheme, SelectionMode, VirtualizationMode } from '../common/Common';

// Utilities
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';
import { css, IDictionary } from '@uifabric/utilities/lib-commonjs/css';
import { KeyCode } from '../constants/KeyboardConstants';
import { PropUtils } from '../utilities/PropUtils';
import { StateManager, SelectionState } from '../managers/StateManager';
import { StateManagerFactory } from '../managers/StateManagerFactory';

export {
    CellContext,
    ContentAlignment,
    ICellType,
    IColumnDefinition,
    ICellDefinition,
    IHeaderDefinition,
    VirtualizationMode
};

/** SelectionModes to be used for the list */
export enum ListSelectionMode {
    /**
     * Selection not allowed, This would not render the selection check mark column
     */
    None = 0,

    /**
     * Only one row can be selected at a time, check mark added to toggle single row selection.
     */
    Single = 1,

    /**
     * Multiple rows can be selected, check mark added to toggle multiple rows selection
     */
    Multi = 2
}

export interface IListProps extends IAbstractGridProps {

    /** The selection mode for this list */
    selectionMode?: ListSelectionMode;

    /*----------------
    |                |
    | EVENT HANDLERS |
    |                |
    ----------------*/

    /**
     * Handler for the selection change by the user
     * @param selectedRows - The list of selected rows
     */
    onSelectionChanged?: (selectedRows: Object[]) => void;
}

export interface IListState extends IAbstractGridState {
}

/**
 * The List component is a higher order component that displays provided data
 * in a List format
 */
export class List extends AbstractGrid<IListProps, IListState> {
    /**
     * State for List
     * Needs to be redefined here so that it can be initialized in this class's ctor
     */
    public state: Readonly<IListState>;
    /** The manager for the Grid's selections state machine */
    protected stateManager: StateManager;

    /** Mapping for maintaining selected object keys */
    private selectedKeys: _.Dictionary<boolean>;

    /** Definition for the selection column */
    private selectionColumnDefinition: IColumnDefinition = {
        id: 'SelectionColumn',
        editable: false,
        draggable: false,
        resizable: false,
        sortable: false,
        rowSpan: 1,
        selectable: true,
        width: `${GridDefaultProps.RowHeaderWidth}px`,
        header: {
            label: ''
        },
        cell: {
            accessor: (rowData: Object) => rowData,
            type: new SelectionCell()
        }
    };

    constructor(props: IListProps, context?: any) {
        super(props, context);

        const {
            selectionMode = ListSelectionMode.None,
            hideColumnHeader
        } = this.props;

        if (selectionMode !== ListSelectionMode.None) {
            this.columnDefinitions = this.props.columnDefinitions.slice();
            this.columnDefinitions.unshift(this.selectionColumnDefinition);
        }

        this.selectedKeys = {};

        // Initialize the state manager
        this.stateManager = this.initializeStateManager(selectionMode, hideColumnHeader);

        this.state = {
            cellContextMenuCoordinate: null,
            columnWidths: null,
            headerContextMenuIndex: null,
            selectionState: GridConstants.DEFAULT_SELECTION_STATE
        };
    }

    public name(): string {
        return 'List';
    }

    /*---------------------
    |                     |
    | RENDERING/LIFECYCLE |
    |                     |
    ---------------------*/

    /** Returns the fill enabled flag to be used by the BaseGrid */
    protected get isFillEnabled(): boolean {
        return false;
    }

    /** Returns the selection mode to be used by the BaseGrid, @default None */
    protected get selectionMode(): SelectionMode {
        const {
            selectionMode = ListSelectionMode.None
        } = this.props;

        return this.getGridSelectionMode(selectionMode);
    }

    /** Returns the show row header flag to be used by the BaseGrid */
    protected get showRowHeader(): boolean {
        return false;
    }

    /** Returns the theme to use for styling the BaseGrid */
    protected get gridTheme(): GridTheme {
        return GridThemes.NoBorder;
    }

    /**
     * Validate any new props
     */
    public componentWillReceiveProps(nextProps: IListProps) {
        super.componentWillReceiveProps(nextProps);

        const {
            selectionMode = ListSelectionMode.None,
            columnDefinitions,
            rowData,
            rowKey,
            hideColumnHeader
        } = nextProps;

        // if the selection mode has changed, reset the selection state
        if (nextProps.selectionMode !== this.props.selectionMode) {
            this.resetStateManager(selectionMode, hideColumnHeader);
        }

        if (selectionMode !== ListSelectionMode.None) {
            this.columnDefinitions = columnDefinitions.slice();
            this.columnDefinitions.unshift(this.selectionColumnDefinition);

            // Compute the currently selected regions using the selected mapping
            let selectedRegions: GridRegion[] = this.getSelectionsFromMapping(rowData, rowKey, this.selectedKeys);

            // Set a new selection state
            this.setState((prevState: IListState) => {
                prevState.selectionState = {
                    fillSelection: null,
                    mode: selectedRegions.length ? GridMode.Select : GridMode.None,
                    primaryCell: selectedRegions.length ? selectedRegions[0].primaryCoordinate : null,
                    selections: selectedRegions
                };

                return prevState;
            });
        }
    }

    /**
     * Handler to decide if a cell is editable
     * @param cellCoordinate The cell to check
     * @returns Is this cell editable?
     */
    @autobind
    protected isCellEditable(cellCoordinate: GridCoordinate): boolean {
        return false;
    }

    /**
     * Renders a string or JSX.Element based on a piece of data (from a row) and a column definition
     * @param cellCoordinate The cell to render
     * @param extractedCellData The cell data extracted from the rowData using corresponding column definition
     * @param columnWidth The width of the column that this cell is in
     */
    protected getRenderedElement(cellCoordinate: GridCoordinate, extractedCellData: any, columnWidth: number): JSX.Element | string {
        const {
            selectionState
        } = this.state;

        let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

        let cellDefinition: ICellDefinition = columnDefinition.cell;
        let renderedElement: JSX.Element | string = null;

        let cellContext: CellContext = this.getCellContext(cellCoordinate, columnWidth);
        if (selectionState.mode === GridMode.Select && selectionState.primaryCell.equals(cellCoordinate) && cellDefinition.type.renderSelected) {
            renderedElement = cellDefinition.type.renderSelected(extractedCellData, null, cellContext);
        } else {
            renderedElement = cellDefinition.type.render(extractedCellData, cellContext);
        }

        return renderedElement;
    }

    /*----------------
    |                |
    | MOUSE HANDLERS |
    |                |
    ----------------*/

    /**
     * Click handler for a cell. If clicked on selection cell, toggles the row, else makes the row selected
     * @param cellCoordinate The coordinate of the clicked cell
     * @param event The MouseEvent related to the click
     */
    @autobind
    protected onCellClick(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
        const {
            selectionMode = ListSelectionMode.None
        } = this.props;

        let newSelectionState: SelectionState;
        if (selectionMode !== ListSelectionMode.None) {
            let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
            // if clicked on selection cell, toggle the selection for the row
            if (columnDefinition.id === this.selectionColumnDefinition.id) {
                this.toggleSelection(cellCoordinate.rowIndex);
            } else {
                // creates a new selection with the single row
                let maxColumnIndex: number = this.getMaxColumnIndex();
                let primaryCoordinate: GridCoordinate = new GridCoordinate(cellCoordinate.rowIndex, 0);
                let secondaryCoordinate: GridCoordinate = new GridCoordinate(cellCoordinate.rowIndex, maxColumnIndex);
                newSelectionState = {
                    fillSelection: null,
                    mode: GridMode.Select,
                    primaryCell: cellCoordinate,
                    selections: [new GridRegion(primaryCoordinate, secondaryCoordinate)]
                };

                this.updateFromEvent(event, newSelectionState);
            }
        }

        super.onCellClick(cellCoordinate, event);
    }

    @autobind
    protected onCellRightClick(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
        const {
            selectionState
        } = this.state;

        super.onCellRightClick(cellCoordinate, event);
        this.updateFromEvent(event, this.stateManager.handleCellRightClick(selectionState, cellCoordinate));
    }

    /*-------------------
    |                   |
    | KEYBOARD HANDLERS |
    |                   |
    -------------------*/

    /**
     * Capture the keyUp event, and update the grid state depending on the key
     */
    @autobind
    protected onKeyUp(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        // We want to set the first row as focused when user tab's into the grid.
        // We could not use onFocus event here, since that would be called on click as well
        // (setting first row as focused before the setting the clicked row as focused, so listening for keyUp to avoid that)
        if (event.keyCode === KeyCode.TAB) {
            let newState: SelectionState = this.stateManager.handleFocus(selectionState);
            if (newState) {
                this.onSelectionStateChanged(newState);
            }
        }
    }

    /**
     * Handles all character keys. If a character key is pressed, switch the grid to edit mode
     */
    @autobind
    protected onKeyPress(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        this.updateFromEvent(event, this.stateManager.handleKeyPress(selectionState));
    }

    /**
     * Handler for the Home key down event
     * Updates the selection through the state manager
     */
    protected handleHomeKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        if (event.ctrlKey && event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleControlShiftHome(selectionState));
        } else if (event.ctrlKey) {
            this.updateFromEvent(event, this.stateManager.handleControlHome(selectionState));
        } else if (event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleShiftHome(selectionState));
        } else {
            this.updateFromEvent(event, this.stateManager.handleHome(selectionState));
        }
    }

    /**
     * Handler for the End key down event
     * Updates the selection through the state manager
     */
    protected handleEndKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        if (event.ctrlKey && event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleControlShiftEnd(selectionState));
        } else if (event.ctrlKey) {
            this.updateFromEvent(event, this.stateManager.handleControlEnd(selectionState));
        } else if (event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleShiftEnd(selectionState));
        } else {
            this.updateFromEvent(event, this.stateManager.handleEnd(selectionState));
        }
    }

    /**
     * Handler for the Up Arrow key down event
     * Updates the selection through the state manager
     */
    protected handleUpArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        if (event.ctrlKey && event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleControlShiftUp(selectionState));
        } else if (event.ctrlKey) {
            this.updateFromEvent(event, this.stateManager.handleControlUp(selectionState));
        } else if (event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleShiftUp(selectionState));
        } else {
            this.updateFromEvent(event, this.stateManager.handleUp(selectionState));
        }
    }

    /**
     * Handler for the Down Arrow key down event
     * Updates the selection through the state manager
     */
    protected handleDownArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        const {
            selectionState
        } = this.state;

        if (event.ctrlKey && event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleControlShiftDown(selectionState));
        } else if (event.ctrlKey) {
            this.updateFromEvent(event, this.stateManager.handleControlDown(selectionState));
        } else if (event.shiftKey) {
            this.updateFromEvent(event, this.stateManager.handleShiftDown(selectionState));
        } else {
            this.updateFromEvent(event, this.stateManager.handleDown(selectionState));
        }
    }

    /*---------
    |         |
    | HELPERS |
    |         |
    ---------*/

    /**
     * Get the class name for a row
     * Translates rowIndex to a row and calls the rowClassName accessor
     * @param rowIndex The row index
     */
    @autobind
    protected getRowClassName(rowIndex: number): string {
        const {
            rowClassName
        } = this.props;

        const {
            selectionState
        } = this.state;

        let cssMapping: IDictionary = {
            selected: this.getSelectedRowIndexes(selectionState.selections).indexOf(rowIndex) >= 0
        };

        const row: Object = this.getRowDataAtIndex(rowIndex);
        return css(cssMapping, PropUtils.getValueFromAccessorWithDefault(null, rowClassName, row));
    }

    /**
     * Returns the class name to be used by the grid
     */
    @autobind
    protected getGridClassName(): string {
        const {
            className
        } = this.props;

        return css('grid-list', className);
    }

    /*----------------
    |                |
    | STATE MANAGERS |
    |                |
    ----------------*/

    /**
     * Updates the selection state
     * Calls the onSelectionChanged if transitioning to Select Mode, with the selected rows
     * @param selectionState The updated selection state
     */
    @autobind
    protected onSelectionStateChanged(selectionState: SelectionState): void {
        const {
            onSelectionChanged,
            rowKey
        } = this.props;

        if (selectionState) {
            this.setState((prevState: IListState) => {
                prevState.selectionState = selectionState;
                return prevState;
            });

            // Invalidate the existing selection mapping and reconstruct it based on the provided selection
            this.selectedKeys = {};
            let selectedRows: Object[] = this.getSelectedRows(selectionState.selections);
            for (let selectedRow of selectedRows) {
                let resolvedRowKey = rowKey(selectedRow);
                this.selectedKeys[resolvedRowKey] = true;
            }

            if (selectionState.mode === GridMode.Select && onSelectionChanged) {
                onSelectionChanged(selectedRows);
            }
        }
    }

    /**
     * Update the state due to a synthetic event.
     * Assigns the parameters to the Grid state.
     * @param event The event that triggered the update
     * @param newState The new selection state acquired from a state manager
     */
    private updateFromEvent(
        event: React.SyntheticEvent<HTMLElement>,
        newState: SelectionState
    ): void {

        if (newState) {
            event.stopPropagation();
            event.preventDefault();

            this.onSelectionStateChanged(newState);
        }
    }

    /**
     * Intialize a new state manager with all the required helper functions
     * @param selectionMode The current selection mode
     * @param hideColumnHeader If the column header is hidden
     */
    private initializeStateManager(selectionMode: ListSelectionMode, hideColumnHeader: boolean = GridDefaultProps.HideColumnHeader): StateManager {
        let gridSelectionMode: SelectionMode = this.getGridSelectionMode(selectionMode);

        return StateManagerFactory.createStateManager(
            gridSelectionMode,
            {
                getMappedCell: this.getMappedCell,
                getMinSelectableColumnIndex: this.getMinSelectableColumnIndex,
                getMaxSelectableColumnIndex: this.getMaxSelectableColumnIndex,
                getMaxColumnIndex: this.getMaxColumnIndex,
                getMaxRowIndex: this.getMaxRowIndex,
                getRowSpan: this.getRowSpan,
                isCellEditable: this.isCellEditable,
                isColumnSelectable: this.getIsColumnSelectable,
                isColumnHeaderHidden: hideColumnHeader
            }
        );
    }

    /**
     * Reinitialize the state manager and reset the selection state to the default state
     * @param selectionMode The new selection mode
     */
    private resetStateManager(selectionMode: ListSelectionMode, hideColumnHeader: boolean): void {
        // The selection mode has changed, we should clear the selection
        // Re-initialize the state manager
        this.stateManager = this.initializeStateManager(selectionMode, hideColumnHeader);
        this.selectedKeys = {};
        // Clear any existing selection
        this.setState((prevState: IListState) => {
            prevState.selectionState = GridConstants.DEFAULT_SELECTION_STATE;
            return prevState;
        });
    }

    /**
     * Returns the Grid SelectionMode corresponding to the List SelectionMode
     * @param selectionMode The list selection mode
     */
    private getGridSelectionMode(selectionMode: ListSelectionMode): SelectionMode {
        switch (selectionMode) {
            case ListSelectionMode.Single:
                return SelectionMode.SingleRow;
            case ListSelectionMode.Multi:
                return SelectionMode.MultipleRow;
        }

        return SelectionMode.None;
    }

    /**
     * Toggles the selection for a given row
     * @param rowIndex The row index to toggle the selection for
     */
    private toggleSelection(rowIndex: number): void {
        const {
            selectionState
        } = this.state;

        const {
            onSelectionChanged,
            selectionMode = ListSelectionMode.None
        } = this.props;

        let selectedRowIndexes: number[] = this.getSelectedRowIndexes(selectionState.selections);
        let rowIndexInSelection: number = selectedRowIndexes.indexOf(rowIndex);
        let rowKey: string = this.getRowKey(rowIndex);

        if (this.selectedKeys[rowKey]) {
            // if row already selected, remove it
            selectedRowIndexes.splice(rowIndexInSelection, 1);
            delete this.selectedKeys[rowKey];
        } else if (selectionMode === ListSelectionMode.Single) {
            // if single selection mode, set this row as selected rows
            selectedRowIndexes = [rowIndex];
            this.selectedKeys = {};
            this.selectedKeys[rowKey] = true;
        } else if (selectionMode === ListSelectionMode.Multi) {
            // if multi selection mode, add this row to selected rows
            selectedRowIndexes.push(rowIndex);
            this.selectedKeys[rowKey] = true;
        }

        let selections: GridRegion[] = this.getSelections(selectedRowIndexes);

        let newSelectionState: SelectionState = {
            mode: selections.length > 0 ? GridMode.Select : GridMode.None,
            fillSelection: null,
            // setting primary cell of first region as the primary grid cell,
            // need more clarification here from the specs, should probably set the clicked cell here
            primaryCell: selections.length > 0 ? selections[0].primaryCoordinate : selectionState.primaryCell,
            selections: selections
        };

        this.setState((prevState: IListState) => {
            prevState.selectionState = newSelectionState;
            return prevState;
        });

        if (onSelectionChanged) {
            let selectedRows: Object[] = _.map(selectedRowIndexes, (selectedRowIndex: number) => this.getRowDataAtIndex(selectedRowIndex));
            onSelectionChanged(selectedRows);
        }
    }

    /**
     * Returns the list of GridRegions corresponding to the list of selected rows
     * @param selectedRows The list of selected rows
     * @returns list of GridRegions, [] if no selected rows
     */
    private getSelections(selectedRows: number[]): GridRegion[] {
        let maxColumnIndex: number = this.getMaxColumnIndex();

        if (selectedRows) {
            // for every row, add the corresponding GridRegion
            let selections: GridRegion[] = _.map(selectedRows, (rowIndex: number) => {
                return new GridRegion(new GridCoordinate(rowIndex, 0), new GridCoordinate(rowIndex, maxColumnIndex));
            });

            return selections;
        }

        return [];
    }

    /**
     * Given a mapping of selected keys, get a list of selected regions
     * @param rowData The row data
     * @param rowKey Delegate to get a key for a row
     * @param mapping The selected keys
     */
    private getSelectionsFromMapping(rowData: Object[], rowKey: (data: Object) => string, mapping: _.Dictionary<boolean>): GridRegion[] {
        let selectedRegions: GridRegion[] = [];
        if (rowData != null && rowKey != null && mapping != null) {
            for (let i = 0; i < rowData.length; i++) {
                let resolvedRowKey = rowKey(rowData[i]);
                if (this.selectedKeys[resolvedRowKey]) {
                    selectedRegions.push(new GridRegion(new GridCoordinate(i, 0), new GridCoordinate(i, this.getMaxColumnIndex())));
                }
            }
        }

        return selectedRegions;
    }

    /**
     * Returns the selected rows indexes corresponding to the list of selected regions
     * @param selectedRegions The list of selected GridRegions
     */
    private getSelectedRowIndexes(selectedRegions: GridRegion[]): number[] {
        let selectedRowIndexes: number[] = [];

        if (selectedRegions) {
            _.forEach(selectedRegions, (selectedRegion: GridRegion) => {
                for (let index: number = selectedRegion.rowRange.start; index <= selectedRegion.rowRange.end; index++) {
                    selectedRowIndexes.push(index);
                }
            });
        }

        return selectedRowIndexes;
    }

    /**
     * Returns the selected rows corresponding to the list of selected regions
     * @param selectedRegions The list of selected GridRegions
     */
    private getSelectedRows(selectedRegions: GridRegion[]): Object[] {
        let selectedRows: Object[] = [];

        if (selectedRegions) {
            _.forEach(selectedRegions, (selectedRegion: GridRegion) => {
                for (let index: number = selectedRegion.rowRange.start; index <= selectedRegion.rowRange.end; index++) {
                    selectedRows.push(this.getRowDataAtIndex(index));
                }
            });
        }

        return selectedRows;
    }
}