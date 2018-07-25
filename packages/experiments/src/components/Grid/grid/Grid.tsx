import * as gridStyles from './Grid.scss';
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
  IHeaderDefinition,
  SortState
} from '../common/AbstractGrid';

import { IGrid } from '../grid/IGrid';

import { Callout, DirectionalHint } from 'office-ui-fabric-react/lib-commonjs/Callout';
import { IContextualMenuItem } from 'office-ui-fabric-react/lib-commonjs/ContextualMenu';

// Constants
import { GridConstants, GridDefaultProps } from '../constants/GridConstants';
import { GridThemes } from '../base/Themes';

// Errors
import { PropValidationError } from '../utilities/errors/Errors';

// Models
import { GridCoordinate, GridMode, GridRegion, GridTheme, SelectionMode, VirtualizationMode } from '../common/Common';

// Utilities
import { autobind } from '../../../../../utilities/lib-commonjs';
import { GridAction, PickerOpenedAction } from '../actions/GridActions';
import { GridUtilities } from '../utilities/GridUtilities';
import { KeyCode } from '../constants/KeyboardConstants';
import { MouseButton } from '../constants/MouseConstants';
import { StateManager, SelectionState } from '../managers/StateManager';
import { StateManagerFactory } from '../managers/StateManagerFactory';

export {
  CellContext,
  ContentAlignment,
  ICellType,
  IColumnDefinition,
  ICellDefinition,
  IGrid,
  IHeaderDefinition,
  SelectionMode,
  SortState,
  VirtualizationMode
};

export interface IGridProps extends IAbstractGridProps {
  /*-----------------------
    |                       |
    | RENDERING INFORMATION |
    |                       |
    -----------------------*/

  /** The width of the row header */
  rowHeaderWidth?: number;

  /**
   * Renderer for custom content in the row header
   * @param rowData The data corresponding to the row for which to render the custom header content
   */
  onRenderRowHeaderContent?: (rowData: Object) => JSX.Element | string;

  /** Context menu items for row header */
  rowHeaderContextMenuItems?: (rowData: Object) => IContextualMenuItem[];

  /** Defines the theme used for styling the cells and header */
  theme?: GridTheme;

  /*---------------
    |               |
    | FEATURE FLAGS |
    |               |
    ---------------*/

  /** Can you perform the fill operation? @default false */
  isFillEnabled?: boolean;

  /** Override to set the whole Grid into read-only mode. If true, the 'editable' value in IColumnDefinition objects will be ignored. */
  isReadOnlyOverride?: boolean;

  /** Should we show the row header? @default false */
  showRowHeader?: boolean;

  /** Should we show the footer row? @default false */
  showFooterRow?: boolean;

  /** The selection mode for this grid */
  selectionMode?: SelectionMode;

  /*----------------
    |                |
    | EVENT HANDLERS |
    |                |
    ----------------*/

  /**
   * Called when an update is made to the row data.
   * @param updates The updates made by the user
   */
  onDataUpdated?: (updates: DataUpdate[]) => void;

  /**
   * Called when the user changes the primary cell
   * @param rowData The newly focused row data
   * @param columnDefinition The newly focused column
   */
  onPrimaryCellChanged?: (rowData: Object, columnDefinition: IColumnDefinition) => void;

  /**
   * Called when the user changed the selected cells
   * @param rowsData The newly focused rows
   */
  onSelectionChanged?: (rowsData: Object[]) => void;

  /**
   * Called when a new row is added
   * @param update The new row data
   */
  onRowAdded?: (update: DataUpdate) => void;
}

export interface IGridState extends IAbstractGridState {
  /** The current uncommited updates */
  pendingUpdates: _.Dictionary<DataUpdateInternal>;

  /** The current validation error */
  validationError: __ValidationResult;
}

/**
 * The Grid component is a higher order component that displays provided data
 * in a spreadsheet style Grid format.
 */
export class Grid extends AbstractGrid<IGridProps, IGridState> implements IGrid {
  /**
   * State for Grid
   * Needs to be redefined here so that it can be initialized in this class's ctor
   */
  public state: Readonly<IGridState>;
  /** The manager for the Grid's selections state machine */
  protected stateManager: StateManager;

  /** The current validation clear timeout function */
  private validationTimeoutId: number;

  /** Should the grid be set to edit mode after selecting */
  private transitionToEditModeAfterSelecting: boolean;

  /** The user action performed to transition to edit mode */
  private transitionToEditModeAction: GridAction;

  constructor(props: IGridProps, context?: any) {
    super(props, context);

    const { selectionMode = GridDefaultProps.SelectionMode, hideColumnHeader } = this.props;

    // Initialize the state manager
    this.stateManager = this.initializeStateManager(selectionMode, hideColumnHeader);

    this.transitionToEditModeAfterSelecting = false;
    this.transitionToEditModeAction = null;

    this.state = {
      cellContextMenuCoordinate: null,
      columnWidths: null,
      headerContextMenuIndex: null,
      pendingUpdates: {},
      selectionState: GridConstants.DEFAULT_SELECTION_STATE,
      validationError: null
    };
  }

  public name(): string {
    return 'Grid';
  }

  /*-----------------
    |                 |
    | IGRID INTERFACE |
    |                 |
    -----------------*/

  /**
   * Change the current primary cell selected
   * @param primaryCell Grid cell coordinates
   */
  @autobind
  public changePrimaryCell(primaryCell: GridCoordinate): void {
    const { selectionState } = this.state;

    const newSelectionState: SelectionState =
      primaryCell != null
        ? {
            ...selectionState,
            primaryCell: primaryCell,
            selections: [new GridRegion(primaryCell)],
            mode: selectionState.mode === GridMode.None ? GridMode.Select : selectionState.mode
          }
        : GridConstants.DEFAULT_SELECTION_STATE;

    this.onSelectionStateChanged(newSelectionState);
  }

  /**
   * Change the current cells selected
   * @param selections Grid regions to select
   */
  @autobind
  public changeSelection(selections: GridRegion[]): void {
    const { selectionState } = this.state;

    const newSelectionState: SelectionState =
      selections != null && selections.length > 0
        ? {
            ...selectionState,
            selections: selections,
            mode: selectionState.mode === GridMode.None ? GridMode.Select : selectionState.mode
          }
        : GridConstants.DEFAULT_SELECTION_STATE;

    this.onSelectionStateChanged(newSelectionState);
  }

  /**
   * Gets the current selection of data
   */
  @autobind
  public getDataInSelection(): Object[] {
    const selections: GridRegion[] = this.state.selectionState.selections || [];
    const rowsData: Object[] = [];
    _.forEach(selections, (selection: GridRegion) => {
      for (let index: number = selection.rowRange.start; index <= selection.rowRange.end; index++) {
        const rowData: Object = this.getRowDataAtIndex(index);
        if (!this.isFooterRow(rowData)) {
          rowsData.push(rowData);
        }
      }
    });
    return rowsData;
  }

  /*---------------------
    |                     |
    | RENDERING/LIFECYCLE |
    |                     |
    ---------------------*/

  /** Returns the fill enabled flag to be used by the BaseGrid */
  protected get isFillEnabled(): boolean {
    return this.props.isFillEnabled;
  }

  /** Returns the theme to use for styling the BaseGrid, @default Green */
  protected get gridTheme(): GridTheme {
    const { theme = GridThemes.Green } = this.props;
    return theme;
  }

  /** Returns the selection mode to be used by the BaseGrid, @default None */
  protected get selectionMode(): SelectionMode {
    const { selectionMode = GridDefaultProps.SelectionMode } = this.props;

    return selectionMode;
  }

  /** Returns the show row header flag to be used by the BaseGrid */
  protected get showRowHeader(): boolean {
    return this.props.showRowHeader;
  }

  /** Returns the row header width to be used by the BaseGrid, @default 50 */
  protected get rowHeaderWidth(): number {
    return this.props.rowHeaderWidth;
  }

  /**
   * Validate any new props
   */
  public componentWillReceiveProps(nextProps: IGridProps) {
    super.componentWillReceiveProps(nextProps);

    const { selectionMode = GridDefaultProps.SelectionMode, hideColumnHeader } = nextProps;

    // if the selection mode has changed, reset the selection state
    if (nextProps.selectionMode !== this.props.selectionMode) {
      this.resetStateManager(selectionMode, hideColumnHeader);
    }
  }

  /**
   * Handler to decide if a cell is editable
   * @param cellCoordinate The cell to check
   * @returns Is this cell editable?
   */
  @autobind
  protected isCellEditable(cellCoordinate: GridCoordinate): boolean {
    const { isReadOnlyOverride, columnDefinitions } = this.props;

    // check the override prop for explicit 'true' value first
    if (isReadOnlyOverride === true) {
      return false;
    }

    // Check column against definitions
    if (cellCoordinate.columnIndex < columnDefinitions.length) {
      const columnDef: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
      if (columnDef.editable && columnDef.cell.type.renderEditor) {
        return true;
      }
    }

    // Default to false
    return false;
  }

  /**
   * Render header delegate for a row
   * @param rowIndex The index of the row for which to render the header cell
   */
  @autobind
  protected renderRowHeaderCell(rowIndex: number): JSX.Element | string {
    const { onRenderRowHeaderContent } = this.props;
    if (onRenderRowHeaderContent) {
      const rowData: Object = this.getRowDataAtIndex(rowIndex);
      return onRenderRowHeaderContent(rowData);
    }
  }

  /**
   * Render the current validation error in a callout above the cell
   */
  protected renderValidationError(): JSX.Element {
    const { validationError } = this.state;

    if (validationError) {
      const cellRef: HTMLDivElement = this.baseGrid.getCellRef(validationError.dataUpdate.cellCoordinate);

      return (
        <Callout
          isBeakVisible={true}
          doNotLayer={false}
          gapSpace={0}
          className={gridStyles.validationCallout}
          target={cellRef}
          directionalHint={DirectionalHint.topCenter}
          setInitialFocus={false}
        >
          <div className={gridStyles.validationCalloutContent}>
            <i className={'ms-Icon ms-Icon--ErrorBadge'} />
            <div className={gridStyles.validationMessage} role="alert" aria-live="assertive" aria-atomic="true">
              {validationError.errorMessage}
            </div>
          </div>
        </Callout>
      );
    }
  }

  /**
   * Renders a string or JSX.Element based on a piece of data (from a row) and a column definition
   * @param cellCoordinate The cell to render
   * @param extractedCellData The cell data extracted from the rowData using corresponding column definition
   * @param columnWidth The width of the column that this cell is in
   */
  protected getRenderedElement(
    cellCoordinate: GridCoordinate,
    extractedCellData: any,
    columnWidth: number
  ): JSX.Element | string {
    const { pendingUpdates, selectionState } = this.state;

    const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

    const cellDefinition: ICellDefinition = columnDefinition.cell;
    const cellIdentifier: string = this.getCellIdentifier(rowData, columnDefinition);
    let renderedData: JSX.Element | string = null;

    let pendingUpdate: any = null;
    if (pendingUpdates[cellIdentifier]) {
      pendingUpdate = pendingUpdates[cellIdentifier].updatedValue;
    }

    const shouldRenderEditor: boolean =
      selectionState.mode === GridMode.Edit &&
      selectionState.primaryCell.equals(cellCoordinate) &&
      cellDefinition.type.renderEditor != null;

    const shouldRenderSelected: boolean =
      (selectionState.mode === GridMode.Select || selectionState.mode === GridMode.Selecting) &&
      selectionState.primaryCell.equals(cellCoordinate) &&
      cellDefinition.type.renderSelected != null;

    const cellContext: CellContext = this.getCellContext(cellCoordinate, columnWidth);
    if (shouldRenderEditor) {
      renderedData = cellDefinition.type.renderEditor(
        extractedCellData,
        pendingUpdate,
        this.transitionToEditModeAction,
        (updatedValue: any) => this.onEditorValueUpdated(cellCoordinate, updatedValue),
        () => this.onEditCancelled(cellCoordinate),
        (finalValue: any) => this.onEditConfirmed(cellCoordinate, finalValue),
        cellContext
      );
    } else if (shouldRenderSelected) {
      renderedData = cellDefinition.type.renderSelected(
        extractedCellData,
        (action?: GridAction) => this.transitionToEditMode(action),
        cellContext
      );
    } else {
      renderedData = cellDefinition.type.render(extractedCellData, cellContext);
    }

    return renderedData;
  }

  /*----------------
    |                |
    | MOUSE HANDLERS |
    |                |
    ----------------*/

  /**
   * Handler for the mousedown event on any cell
   * If selection is enabled, transitions the Grid to Selecting mode
   * @param cellCoordinate The cell that fired the event
   */
  @autobind
  protected onCellMouseDown(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    if (selectionState.mode === GridMode.Edit) {
      if (!selectionState.primaryCell.equals(cellCoordinate)) {
        this.confirmPendingUpdates(selectionState.primaryCell);
      } else {
        // If we are mousing down on a cell already in edit mode, ignore it
        return;
      }
    }

    if (event.button === MouseButton.Left) {
      // If the current selection contains only the cell where mouse down was performed,
      // we should set the grid to Edit mode, unless user drags over to another cell
      this.transitionToEditModeAfterSelecting =
        cellCoordinate.equals(selectionState.primaryCell) &&
        selectionState.selections.length === 1 &&
        selectionState.selections[0].isSingleCell();
      this.handleMouseDown(event, cellCoordinate);
    }
  }

  /**
   * Handler for the mouseenter event on any cell
   * If the Grid is in Selecting mode, add this cell to the current selection
   * If the Grid is in Filling mode, add this cell to the current fill selection
   * @param cellCoordinate The cell that fired the event
   */
  @autobind
  protected onCellMouseEnter(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    const newState: SelectionState = this.stateManager.handleCellMouseEnter(selectionState, cellCoordinate);
    if (newState) {
      this.updateFromMouseEvent(event, newState);

      if (selectionState && selectionState.selections) {
        this.transitionToEditModeAfterSelecting = cellCoordinate.equals(selectionState.primaryCell);
      }
    }
  }

  /**
   * Handler for the mouseup event. Fired when the mouseup event occurs after a cell mousedown event
   * If the selection did not change (a cell was clicked twice), transitions the grid to Edit mode.
   * Otherwise, transitions the Grid back to Select mode
   */
  @autobind
  protected onCellMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    this.updateFromMouseEvent(
      event,
      this.stateManager.handleCellMouseUp(selectionState, this.transitionToEditModeAfterSelecting)
    );
    this.transitionToEditModeAfterSelecting = false;
  }

  /**
   * Handler for the mousedown event on the fill handle
   * Transitions the Grid to Filling mode
   */
  @autobind
  protected onFillMouseDown(event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    if (selectionState.mode === GridMode.Edit) {
      const updateCommitted: boolean = this.confirmPendingUpdates(selectionState.primaryCell);
      if (!updateCommitted) {
        return;
      }
    }

    this.updateFromMouseEvent(event, this.stateManager.handleFillMouseDown(selectionState));
  }

  /**
   * Handler for the mouseup event after a fill operation
   * If a fill region was drawn, inform the parent component a fill operation was completed
   * Merge the current selection region and the fill region to form the new selection
   * Transition the Grid back to Select mode
   */
  @autobind
  protected onFillMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    const newState: SelectionState = this.stateManager.handleFillMouseUp(selectionState);
    if (newState) {
      this.updateFromMouseEvent(event, newState);
      if (selectionState.fillSelection && selectionState.selections.length === 1) {
        this.onFillCompleted(selectionState.selections[0], selectionState.fillSelection);
      }
    }
  }

  @autobind
  protected onCellRightClick(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    super.onCellRightClick(cellCoordinate, event);
    this.updateFromMouseEvent(event, this.stateManager._handleCellRightClick(selectionState, cellCoordinate));
  }

  /**
   * Handler for the mousedown event on row header cell
   * If selection is enabled, transitions the Grid to Selecting mode with rowSelectionManager
   * @param rowIndex The row index where the event was fired
   */
  @autobind
  protected onRowHeaderMouseDown(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    const { hideColumnHeader } = this.props;

    if (selectionState.mode === GridMode.Edit) {
      this.confirmPendingUpdates(selectionState.primaryCell);
    }

    if (event.button === MouseButton.Left) {
      this.stateManager = this.initializeStateManager(SelectionMode.MultipleRow, hideColumnHeader);
      const targetCoordinate: GridCoordinate = new GridCoordinate(rowIndex, 0, false, true);
      this.handleMouseDown(event, targetCoordinate);
    }
  }

  /**
   * Handler for the mouseenter event on row header cell
   * If the Grid is in Selecting mode, add this row to the current selection
   * @param rowIndex The row index where the event was fired
   */
  @autobind
  protected onRowHeaderMouseEnter(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    this.updateFromMouseEvent(
      event,
      this.stateManager.handleCellMouseEnter(selectionState, new GridCoordinate(rowIndex, 0))
    );
  }

  /**
   * Handler for the mouseup event. Fired when the mouseup event occurs after a mousedown event on a row Header cell
   * Transitions the Grid back to Select mode and re-initializes the state manager
   */
  @autobind
  protected onRowHeaderMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { selectionState } = this.state;

    const { selectionMode = GridDefaultProps.SelectionMode, hideColumnHeader } = this.props;

    this.updateFromMouseEvent(event, this.stateManager.handleCellMouseUp(selectionState, false));
    this.stateManager = this.initializeStateManager(selectionMode, hideColumnHeader);
  }

  /**
   * Right click handler for context menu on row header
   * @param rowIndex Index of row that was right clicked
   * @param event The right click event
   */
  @autobind
  protected onRowHeaderRightClick(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { rowHeaderContextMenuItems } = this.props;

    const rowData: Object = this.getRowDataAtIndex(rowIndex);
    if (rowHeaderContextMenuItems && rowHeaderContextMenuItems(rowData).length > 0) {
      event.preventDefault();
      this.cellContextMenuTarget = event.currentTarget as HTMLElement;
      this.setState({ cellContextMenuCoordinate: new GridCoordinate(rowIndex, 0) });
    }
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
    const { selectionState } = this.state;

    // We want to set the first cell as focused when user tab's into the grid.
    // We could not use onFocus event here, since that would be called on click on the cell as well
    // (setting first cell as focused before the setting the clicked cell as focused, so listening for keyUp to avoid that)
    if (event.keyCode === KeyCode.TAB) {
      const newState: SelectionState = this.stateManager.handleFocus(selectionState);
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
    const { selectionState } = this.state;

    let inputValue: string = String.fromCharCode(event.charCode);
    // found that onKeyPress gets triggered for ENTER as well.
    // so putting a check on the trimmed value
    inputValue = inputValue.trim();
    if (inputValue.length > 0) {
      const newState: SelectionState = this.stateManager.handleKeyPress(selectionState);
      if (newState) {
        // if switching to edit mode due to key press, preserve the input key and set that as pending update on the primary cell
        if (selectionState.mode === GridMode.Select && newState.mode === GridMode.Edit) {
          this.onEditorValueUpdated(selectionState.primaryCell, inputValue);
        }

        this.updateFromKeyboardEvent(event, newState);
      }
    }
  }

  /**
   * Clears the data in the selected cells
   * @param event The keyboard event
   */
  protected handleDeleteKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    // We should clear the cell
    if (selectionState.mode === GridMode.Select) {
      for (const selection of selectionState.selections) {
        for (const cell of selection.cells()) {
          this.constructAndSendUpdate(cell, null);
        }
      }
    }
  }

  /**
   * If the cell was in edit mode, change it to focused, and set the focus back to the grid
   */
  protected handleEscapeKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    // We should clear any pending edits if we are in Edit mode
    if (selectionState.mode === GridMode.Edit) {
      this.clearPendingUpdates(selectionState.primaryCell);
    }

    this.updateFromKeyboardEvent(event, this.stateManager.handleCancelKey(selectionState));
  }

  /**
   * If we are in cell focused mode, switch the focus to the first cell in a row or the first cell in the grid, if pressed with ctrl
   */
  protected handleHomeKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftHome(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlHome(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftHome(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleHome(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, switch the focus to the last cell in a row or the last cell in the grid, if pressed with ctrl
   */
  protected handleEndKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftEnd(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlEnd(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftEnd(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleEnd(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, set the cell to be in edit mode
   * If we are in edit mode, switch to the same cell in the next/previous row depending on if shift key was pressed
   * Set the current element back to focus mode if there were no more cells in the desired direction
   */
  protected handleEnterKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { columnDefinitions } = this.props;

    const { selectionState } = this.state;

    if (selectionState.mode === GridMode.Edit) {
      const updatesCommitted = this.confirmPendingUpdates(selectionState.primaryCell);
      if (updatesCommitted && this.shouldAddFooterRow(this.props)) {
        // if last row then add in-memory blank row
        if (selectionState.primaryCell.rowIndex === this.getMaxRowIndex()) {
          this.appendRowData(this.createFooterRow(columnDefinitions));
        }
      }
    }

    if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftEnter(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleEnter(selectionState));
    }
  }

  /**
   * Transition the cell to editable if is editable. Otherwise, NO-OP
   */
  protected handleF2KeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    this.updateFromKeyboardEvent(event, this.stateManager.handleEditKey(selectionState));
  }

  /**
   * If we are in edit mode, switch to the next/previous cell in the same row depending on if shift key was pressed
   * Set the current element back to focus mode if there were no more cells in the desired direction
   */
  protected handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (selectionState.mode === GridMode.Edit) {
      this.confirmPendingUpdates(selectionState.primaryCell);
    }

    if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftTab(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleTab(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, switch the focus to previous cell in the same row
   */
  protected handleLeftArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.altKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleAltShiftLeft(selectionState));
    } else if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftLeft(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlLeft(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftLeft(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleLeft(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, switch the focus to next cell in the same row
   */
  protected handleRightArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.altKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleAltShiftRight(selectionState));
    } else if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftRight(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlRight(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftRight(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleRight(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, switch the focus to same cell in the previous row
   */
  protected handleUpArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftUp(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlUp(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftUp(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleUp(selectionState));
    }
  }

  /**
   * If we are in cell focused mode, switch the focus to same cell in the next row
   */
  protected handleDownArrowKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { selectionState } = this.state;

    if (event.altKey && selectionState.primaryCell.isColumnHeaderCell) {
      this.onColumnHeaderAltDown(this.state.selectionState.primaryCell.columnIndex, event);
    } else if (event.altKey && (selectionState.mode === GridMode.Select || selectionState.mode === GridMode.Edit)) {
      const columnDef: IColumnDefinition = this.getColumnDefinitionAtIndex(selectionState.primaryCell.columnIndex);
      if (this.isCellEditable(selectionState.primaryCell) && columnDef.cell.type.supportsCalloutForEditing) {
        this.transitionToEditMode(new PickerOpenedAction());
      }
    } else if (event.ctrlKey && event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlShiftDown(selectionState));
    } else if (event.ctrlKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleControlDown(selectionState));
    } else if (event.shiftKey) {
      this.updateFromKeyboardEvent(event, this.stateManager.handleShiftDown(selectionState));
    } else {
      this.updateFromKeyboardEvent(event, this.stateManager.handleDown(selectionState));
    }
  }

  /*---------------
    |               |
    | MISC HANDLERS |
    |               |
    ---------------*/

  /**
   * Called when a fill handle operation is completed
   * Constructs a list of updates and calls the onDataUpdated handler
   * @param sourceRegion The originally selected region
   * @param targetRegion The region that needs to be filled
   */
  @autobind
  protected onFillCompleted(sourceRegion: GridRegion, targetRegion: GridRegion): void {
    const { onDataUpdated } = this.props;

    if (sourceRegion && targetRegion && onDataUpdated) {
      // Construct the list of rows to source the fill data from
      const sourceRows: Object[] = [];
      for (let rowIndex = sourceRegion.rowRange.start; rowIndex <= sourceRegion.rowRange.end; rowIndex++) {
        sourceRows.push(this.getRowDataAtIndex(rowIndex));
      }

      // For each row and column in the targetRegion, construct an update
      const updates: DataUpdateInternal[] = [];
      for (let rowIndex = targetRegion.rowRange.start; rowIndex <= targetRegion.rowRange.end; rowIndex++) {
        const sourceRow = this.getSourceRowForFill(sourceRows, rowIndex, sourceRegion, targetRegion);
        const targetRow = this.getRowDataAtIndex(rowIndex);
        for (
          let columnIndex = sourceRegion.columnRange.start;
          columnIndex <= sourceRegion.columnRange.end;
          columnIndex++
        ) {
          const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
          const data = GridUtilities.getDataFromColumnDefinition(sourceRow, columnDefinition);
          const dataUpdate: DataUpdateInternal = {
            originalRowData: targetRow,
            columnDefinition: columnDefinition,
            updatedValue: data,
            cellCoordinate: new GridCoordinate(rowIndex, columnIndex)
          };
          updates.push(dataUpdate);
        }
      }

      this.validateAndSendUpdates(updates);
    }
  }

  /*---------
    |         |
    | HELPERS |
    |         |
    ---------*/

  /**
   * Validates props for common configurations
   * @param props The props to validate
   */
  protected validateProps(props: IGridProps) {
    super.validateProps(props);

    const { columnDefinitions, onDataUpdated } = props;

    _.forEach(columnDefinitions, (columnDefinition: IColumnDefinition) => {
      // Validating the props for editing scenario
      if (columnDefinition.editable) {
        if (onDataUpdated == null) {
          throw new PropValidationError(
            'Grid',
            'onDataUpdated',
            'A grid with one or more editable columns must specify the onDataUpdated prop'
          );
        }

        if (columnDefinition.cell.type.renderEditor == null) {
          throw new PropValidationError(
            'Grid',
            'renderEditor',
            'An editable column must provide an edit renderer. Column definition: ' + JSON.stringify(columnDefinition)
          );
        }
      }
    });
  }

  /**
   * Returns the a shallow copy of the row data collection with optional modifications
   * @param props React properties object
   */
  @autobind
  protected getRowData(props: IGridProps = this.props) {
    const { columnDefinitions } = props;

    if (this.shouldAddFooterRow(props)) {
      // Add blank row to rowData
      return _.concat(props.rowData, this.createFooterRow(columnDefinitions));
    } else {
      return props.rowData;
    }
  }

  /**
   * Returns the context for a given cell
   * @param cellCoordinate The coordinates of the cell in the grid
   * @param columnWidth The width of the column that this cell is in
   */
  protected getCellContext(gridCoordinate: GridCoordinate, columnWidth: number): CellContext {
    const cellContext = super.getCellContext(gridCoordinate, columnWidth);
    cellContext.inFooterRow = this.isFooterRow(this.getRowDataAtIndex(gridCoordinate.rowIndex));
    return cellContext;
  }

  /**
   * Returns the source row to use for filling a target row
   * @param sourceRows The list of source rows
   * @param targetRowIndex The index of target row to fill
   * @param sourceRegion The source selection
   * @param targetRegion The fill selection
   */
  private getSourceRowForFill(
    sourceRows: Object[],
    targetRowIndex: number,
    sourceRegion: GridRegion,
    targetRegion: GridRegion
  ): Object {
    const isFillDown: boolean = targetRegion.rowRange.start > sourceRegion.rowRange.start;
    if (isFillDown) {
      // determine the target row index relative to target region start and return the corresponding source row
      return sourceRows[(targetRowIndex - targetRegion.rowRange.start) % sourceRows.length];
    } else {
      // when filling up, we need to fill upwards starting the last source row.
      // e.g. filling two source cells (a,b) upward to three target cells should fill the target as (b,a,b) and not (a,b,a)

      // determine the target row index relative to target region end and return the corresponding source row from the end
      return sourceRows[
        (sourceRegion.rowRange.end -
          ((targetRegion.rowRange.end - targetRowIndex) % sourceRows.length) -
          sourceRegion.rowRange.start) %
          sourceRows.length
      ];
    }
  }

  /**
   * Check if we should add a footer row through props and state
   * @param {IGridProps} [props=this.props] The props for the Grid
   * @returns {boolean} True if we should show, false otherwise
   */
  private shouldAddFooterRow(props: IGridProps = this.props): boolean {
    const { isReadOnlyOverride, showFooterRow = GridDefaultProps.ShowFooterRow } = props;
    return showFooterRow && !isReadOnlyOverride && !this.isGridSorted(props);
  }

  /**
   * Check a rowData object to see if it is the footer row
   * @param {Object} rowData The rowData object ot check
   * @returns {boolean} True if it is the footer row
   */
  private isFooterRow(rowData: Object): boolean {
    return rowData && rowData[GridConstants.__FOOTER_ROW_KEY] === true;
  }

  /**
   * Create a footer row with column definitions and a hidden data key
   * @param columnDefinitions Definitions of columns to add to blank row
   */
  private createFooterRow(columnDefinitions: IColumnDefinition[]) {
    // Create blank row object
    const newRow: Object = { [GridConstants.__FOOTER_ROW_KEY]: true };

    // Add blank row to rowData
    return newRow;
  }

  /**
   * Transitions the grid to edit mode with the primary cell as the new selection
   * @param action An optional action which lead to this transition and will be passed to the editor
   */
  private transitionToEditMode(action?: GridAction): void {
    this.setState(
      (prevState: IGridState) => {
        this.transitionToEditModeAction = action;
        prevState.selectionState = {
          ...prevState.selectionState,
          mode: GridMode.Edit,
          selections: [new GridRegion(prevState.selectionState.primaryCell)]
        };
        return prevState;
      },
      () => {
        this.transitionToEditModeAction = null;
      }
    );
  }

  /**
   * Handles the mouse down event. Calls the appropriate selection manager method based on keyPresses associated with the event
   * @param event the mouse down event
   * @param targetCoordinate the cell coordinate for which the mouse down event was triggered
   */
  private handleMouseDown(event: React.MouseEvent<HTMLElement>, targetCoordinate: GridCoordinate) {
    const { selectionState } = this.state;

    if (event.shiftKey && !event.ctrlKey) {
      this.updateFromMouseEvent(event, this.stateManager.handleShiftCellMouseDown(selectionState, targetCoordinate));
    } else if (event.ctrlKey && !event.shiftKey) {
      this.updateFromMouseEvent(event, this.stateManager.handleControlCellMouseDown(selectionState, targetCoordinate));
    } else {
      this.updateFromMouseEvent(event, this.stateManager.handleCellMouseDown(selectionState, targetCoordinate));
    }
  }

  /*---------------
    |               |
    | EDIT HANDLERS |
    |               |
    ---------------*/

  /**
   * Called when an editor calls the onValueUpdated callback. Stores the updated value
   * in the pendingUpdates state object
   *
   * This does not trigger the onDataUpdated delegate. confirmPendingUpdates() must be called to trigger this delegate
   * @param rowData The original row data
   * @param columnDefinition The column where the updated cell is located
   * @param updatedValue The updated value
   */
  private onEditorValueUpdated(cellCoordinate: GridCoordinate, updatedValue: any): void {
    const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

    // We do not want to fire updates for empty or null value in the footer row, so removing the pending update in case user deletes it
    if (!updatedValue && this.isFooterRow(rowData)) {
      this.setState((prevState: IGridState) => {
        delete prevState.pendingUpdates[this.getCellIdentifier(rowData, columnDefinition)];
        return prevState;
      });
    } else {
      const update: DataUpdateInternal = {
        originalRowData: rowData,
        columnDefinition: columnDefinition,
        cellCoordinate: cellCoordinate,
        updatedValue: updatedValue
      };

      this.setState((prevState: IGridState) => {
        prevState.pendingUpdates[this.getCellIdentifier(rowData, columnDefinition)] = update;
        return prevState;
      });
    }
  }

  /**
   * Called when the editor requests edits to be committed.
   * Constructs an update with the provided value and calls the onDataUpdated delegate
   * Performs the same state change as the ENTER key
   *
   * @param cellCoordinate The cell to update
   * @param finalValue The final value the editor is requesting to be committed
   */
  @autobind
  private onEditConfirmed(cellCoordinate: GridCoordinate, finalValue: any): void {
    // Return to select mode
    this.setState((prevState: IGridState) => {
      prevState.selectionState = {
        ...prevState.selectionState,
        mode: GridMode.Select
      };
      return prevState;
    });

    this.constructAndSendUpdate(cellCoordinate, finalValue);

    // clear the update
    this.clearPendingUpdates(cellCoordinate);
  }

  /**
   * Called when an editor requests edits to be cancelled.
   * Clears any pending updates, and performs the same state change as the ESC key
   * @param cellCoordinate The cell to clear
   */
  @autobind
  private onEditCancelled(cellCoordinate: GridCoordinate): void {
    const newState = this.stateManager.handleCancelKey(this.state.selectionState);
    if (newState != null) {
      this.setState((prevState: IGridState) => {
        prevState.selectionState = newState;
        return prevState;
      });
    }

    this.clearPendingUpdates(cellCoordinate);
  }

  /**
   * Flush pending updates for a cell
   * Calls the onDataUpdated delegate
   * @param cellCoordinate The cell to update
   * @returns True if the updates were committed, False otherwise
   */
  private confirmPendingUpdates(cellCoordinate: GridCoordinate): boolean {
    const { pendingUpdates } = this.state;

    const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

    const cellIdentifier: string = this.getCellIdentifier(rowData, columnDefinition);
    if (pendingUpdates[cellIdentifier]) {
      const updateCommitted: boolean = this.validateAndSendUpdates([pendingUpdates[cellIdentifier]]);

      // clear the update
      this.clearPendingUpdates(cellCoordinate);
      return updateCommitted;
    } else if (this.isFooterRow(rowData)) {
      // Footer row commits are handled by the HOC via onRowAdded callback, not by the Grid itself
      return false; // Footer row commits are not handled here
    }

    return true;
  }

  /**
   * Clears pending updates for a cell
   * @param cellCoordinate The cell to clear
   */
  private clearPendingUpdates(cellCoordinate: GridCoordinate): void {
    const { pendingUpdates } = this.state;

    const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

    const cellIdentifier: string = this.getCellIdentifier(rowData, columnDefinition);
    if (pendingUpdates[cellIdentifier]) {
      this.setState((prevState: IGridState) => {
        // Clone the dictionary
        prevState.pendingUpdates = {
          ...prevState.pendingUpdates
        };

        // Delete the update
        delete prevState.pendingUpdates[cellIdentifier];
        return prevState;
      });
    }
  }

  /**
   * Constructs and sends a data update for the provided row and column
   * @param cellCoordinate The cell to send an update for
   * @param value The new value
   */
  private constructAndSendUpdate(cellCoordinate: GridCoordinate, value: any): void {
    const { onDataUpdated } = this.props;

    const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);

    // Construct and send the committed update
    if (onDataUpdated) {
      const update: DataUpdateInternal = {
        originalRowData: rowData,
        columnDefinition: columnDefinition,
        cellCoordinate: cellCoordinate,
        updatedValue: value
      };

      this.validateAndSendUpdates([update]);
    }
  }

  /**
   * Validate the provided updates and call onDataUpdated if the updates are valid
   * Else, set the current validation error
   * @param dataUpdates The updates to validate and send
   * @returns True if the updates were committed, False in case of a validation failure
   */
  private validateAndSendUpdates(dataUpdates: DataUpdateInternal[]): boolean {
    const { onDataUpdated } = this.props;

    try {
      if (onDataUpdated) {
        // Set the updated values using preProcessInput to clean up data
        const cleanedUpdates: DataUpdateInternal[] = _.map(dataUpdates, (dataUpdate: DataUpdateInternal) => {
          const columnDefinition = dataUpdate.columnDefinition;
          const originalData = GridUtilities.getDataFromColumnDefinition(dataUpdate.originalRowData, columnDefinition);
          dataUpdate.updatedValue = columnDefinition.cell.type.parseRawInput
            ? columnDefinition.cell.type.parseRawInput(originalData, dataUpdate.updatedValue)
            : dataUpdate.updatedValue;
          return dataUpdate;
        });
        // first, validate each update
        const validationResults: __ValidationResult[] = this.validateUpdates(cleanedUpdates);
        const invalidUpdates = _.filter(
          validationResults,
          (validationResult: __ValidationResult) => !validationResult.isValid
        );
        if (invalidUpdates.length === 0) {
          this.sendUpdates(cleanedUpdates);
          return true;
        } else {
          // Show the first validation error for now
          this.setState(
            (prevState: IGridState) => {
              prevState.validationError = invalidUpdates[0];
              prevState.selectionState.mode = GridMode.Select;
              return prevState;
            },
            () => {
              if (this.validationTimeoutId != null) {
                this.async.clearTimeout(this.validationTimeoutId);
              }
              this.validationTimeoutId = this.async.setTimeout(() => {
                this.validationTimeoutId = null;
                this.setState((prevState: IGridState) => {
                  prevState.validationError = null;
                  return prevState;
                });
              }, GridConstants.VALIDATION_CLEAR_DELAY);
            }
          );
        }
      }
    } catch (e) {
      console.error('Grid: There was an error committing updates', e);
    }

    return false;
  }

  /**
   * Convert the internal updates and send them
   * @param dataUpdates The updates to send
   */
  private sendUpdates(dataUpdates: DataUpdateInternal[]): void {
    const { onDataUpdated, onRowAdded } = this.props;

    if (onDataUpdated) {
      const constructedUpdates: DataUpdate[] = [];
      // Group all de-normalized updates by common rows
      const groupedUpdates = _.groupBy(
        dataUpdates,
        (dataUpdateInternal: DataUpdateInternal) => dataUpdateInternal.cellCoordinate.rowIndex
      );
      for (const key in groupedUpdates) {
        // Construct one update object for each row
        const updates: DataUpdateInternal[] = groupedUpdates[key];
        const dataUpdate: DataUpdate = {
          originalRowData: updates[0].originalRowData,
          updates: {}
        };

        for (const update of updates) {
          dataUpdate.updates[update.columnDefinition.id] = update.updatedValue;
        }

        if (onRowAdded && this.isFooterRow(dataUpdate.originalRowData)) {
          onRowAdded(dataUpdate);
        } else {
          constructedUpdates.push(dataUpdate);
        }
      }

      if (constructedUpdates.length > 0) {
        onDataUpdated(constructedUpdates);
      }
    }
  }

  /**
   * Validate a set of updates and return the validation results
   * @param dataUpdates The updates to validate
   */
  private validateUpdates(dataUpdates: DataUpdateInternal[]): __ValidationResult[] {
    const validationResults: __ValidationResult[] = [];
    for (const dataUpdate of dataUpdates) {
      const cellDefinition: ICellDefinition = dataUpdate.columnDefinition.cell;
      let validationError: string;

      // If the cell type defines a default validator, use that first
      if (cellDefinition.type.validate) {
        validationError = cellDefinition.type.validate(dataUpdate.updatedValue);
      }

      // Run additional validations
      if (cellDefinition.validators) {
        let counter = 0;
        while (!validationError && counter < cellDefinition.validators.length) {
          validationError = cellDefinition.validators[counter++](dataUpdate.updatedValue);
        }
      }

      validationResults.push({
        isValid: !validationError,
        errorMessage: validationError,
        dataUpdate: dataUpdate
      });
    }

    return validationResults;
  }

  /*----------------
    |                |
    | STATE MANAGERS |
    |                |
    ----------------*/

  /**
   * Updates the selection state
   * Checks to see if the primary cell has changed and calls the onPrimaryCellChanged handler
   * Also, calls onSelectionChanged handler passing the rows corresponding to the new selection
   * @param selectionState The updated selection state
   */
  @autobind
  private onSelectionStateChanged(selectionState: SelectionState): void {
    const { onPrimaryCellChanged, onSelectionChanged } = this.props;

    if (selectionState) {
      const priorPrimaryCell = this.state.selectionState.primaryCell;

      const handleStateChange = () => {
        if (
          onPrimaryCellChanged &&
          selectionState.primaryCell &&
          !selectionState.primaryCell.equals(priorPrimaryCell)
        ) {
          onPrimaryCellChanged(
            this.getRowDataAtIndex(selectionState.primaryCell.rowIndex),
            this.getColumnDefinitionAtIndex(selectionState.primaryCell.columnIndex)
          );
        }

        if (onSelectionChanged && (selectionState.mode === GridMode.Select || selectionState.mode === GridMode.None)) {
          onSelectionChanged(this.getDataInSelection());
        }
      };

      this.setState((prevState: IGridState) => {
        prevState.selectionState = selectionState;
        return prevState;
      }, handleStateChange);
    }
  }

  /**
   * Update the state due to a mouse event.
   * Assigns the parameters to the Grid state.
   * NOTE: This does not prevent the default behavior of the event
   * @param event The event that triggered the update
   * @param newState The new selection state acquired from a state manager
   */
  private updateFromMouseEvent(event: React.SyntheticEvent<HTMLElement>, newState: SelectionState): void {
    if (newState) {
      event.stopPropagation();
      this.onSelectionStateChanged(newState);
    }
  }

  /**
   * Update the state due to a keyboard event.
   * Assigns the parameters to the Grid state.
   * NOTE: This prevents the default behavior of the event
   * @param event The event that triggered the update
   * @param newState The new selection state acquired from a state manager
   */
  private updateFromKeyboardEvent(event: React.SyntheticEvent<HTMLElement>, newState: SelectionState): void {
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
  private initializeStateManager(
    selectionMode: SelectionMode,
    hideColumnHeader: boolean = GridDefaultProps.HideColumnHeader
  ): StateManager {
    return StateManagerFactory.createStateManager(selectionMode, {
      getMappedCell: this.getMappedCell,
      getMinSelectableColumnIndex: this.getMinSelectableColumnIndex,
      getMaxSelectableColumnIndex: this.getMaxSelectableColumnIndex,
      getMaxColumnIndex: this.getMaxColumnIndex,
      getMaxRowIndex: this.getMaxRowIndex,
      getRowSpan: this.getRowSpan,
      isCellEditable: this.isCellEditable,
      isColumnSelectable: this.getIsColumnSelectable,
      isColumnHeaderHidden: hideColumnHeader
    });
  }

  /**
   * Reinitialize the state manager and reset the selection state to the default state
   * @param selectionMode The new selection mode
   */
  private resetStateManager(selectionMode: SelectionMode, hideColumnHeader: boolean): void {
    // The selection mode has changed, we should clear the selection
    // Re-initialize the state manager
    this.stateManager = this.initializeStateManager(selectionMode, hideColumnHeader);

    // Clear any existing selection
    this.setState((prevState: IGridState) => {
      prevState.selectionState = GridConstants.DEFAULT_SELECTION_STATE;
      return prevState;
    });
  }
}

/**
 * A data update
 */
export type DataUpdate = {
  /** The original row data */
  originalRowData: Object;
  /** The updates keyed by column definition id */
  updates: _.Dictionary<any>;
};

/**
 * Internal representation of a data update
 */
export type DataUpdateInternal = {
  /** The original row data */
  originalRowData: Object;

  /** The column definition */
  columnDefinition: IColumnDefinition;

  /** The coordinate of the updated cell */
  cellCoordinate: GridCoordinate;

  /** The updated value */
  updatedValue: any;
};

/**
 * Internal representation of a validation result
 */
export type __ValidationResult = {
  /** Is the update valid? */
  isValid: boolean;

  /** Optional error message */
  errorMessage?: string;

  /** The update that was validated */
  dataUpdate: DataUpdateInternal;
};
