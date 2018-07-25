/*tslint:disable:member-ordering*/
import './AbstractGrid.scss';
import * as React from 'react';
import * as _ from 'lodash';

// Components
import { BaseComponent } from '../utilities/BaseComponent';
import { BaseGrid } from '../base/BaseGrid';
import {
  ContextualMenu,
  IContextualMenuItem,
  DirectionalHint
} from 'office-ui-fabric-react/lib-commonjs/ContextualMenu';

// Constants
import { GridConstants, GridDefaultProps } from '../constants/GridConstants';
import { Icons } from '../constants/IconConstants';

// Models
import {
  GridCoordinate,
  GridTheme,
  GridRegion,
  GridSize,
  GridSizeUnit,
  SelectionMode,
  VirtualizationMode
} from '../common/Common';

// Utilities
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';
import { css, IDictionary } from '@uifabric/utilities/lib-commonjs/css';
import { getRTL, getRTLSafeKeyCode } from '@uifabric/utilities/lib-commonjs/rtl';
import { GridAction } from '../actions/GridActions';
import { GridUtilities } from '../utilities/GridUtilities';
import { KeyCode } from '../constants/KeyboardConstants';
import { PropUtils } from '../utilities/PropUtils';
import { PropValidationError } from '../utilities/errors/Errors';
import { SelectionState } from '../managers/StateManager';
import { Validators } from '../validators/Validators';
import { HierarchyCell } from '../types/HierarchyCell';
import { IGridAriaAttributes } from './IGridAriaAttributes';

export interface IAbstractGridProps {
  /*-----------------------
    |                       |
    | RENDERING INFORMATION |
    |                       |
    -----------------------*/

  /**
   * Optional object to pass in to control forcing re-rendering of grid data.
   * When a new dataKey object is passed into the grid it signals to the grid
   * that the old data is dirty and grid will do full re-render of all its cells.
   */
  dataKey?: Object;

  /** The aria label describing the grid */
  ariaLabel?: string;

  /** The class name for the grid */
  className?: string;

  /** The column definitions for this grid. See the { @link IColumnDefinition } interface for more information */
  columnDefinitions: IColumnDefinition[];

  /** The class name of the header row */
  headerClassName?: string;

  /** The height of the header row. Default defined in BaseGrid @default 30 */
  headerRowHeight?: number;

  /** Text to display if there is no data */
  placeholderText?: string;

  /** Aria and data attributes for a row */
  rowAriaAndDataAttributes?: _.Dictionary<string> | ((rowData: Object) => _.Dictionary<string>);

  /** Class name for a row */
  rowClassName?: string | ((rowData: Object) => string);

  /** The row data to render in the grid */
  rowData: Object[];

  /** The height of each row in pixels. Default defined in BaseGrid @default 50 */
  rowHeight?: number;

  /** A key that uniquely identifies a row */
  rowKey: (rowData: Object) => string;

  /** The current sort state */
  sortState?: SortState;

  /*---------------
    |               |
    | FEATURE FLAGS |
    |               |
    ---------------*/
  /** Should we hide the column header? @default false */
  hideColumnHeader?: boolean;

  /** Is the Grid header sticky? @default false */
  isHeaderSticky?: boolean;

  /** The virtualization mode of the grid. Defaults to VirtualizationMode.None */
  virtualizationMode?: VirtualizationMode;

  /*----------------
    |                |
    | EVENT HANDLERS |
    |                |
    ----------------*/

  /**
   * Called when a column is re-ordered
   * @param column The column being moved
   * @param newIndex Where the column was dropped
   */
  onColumnReorder?: (column: IColumnDefinition, newIndex: number) => void;

  /**
   * Called when a column is re-sized
   * @param column The re-sized column
   * @param size The new size
   */
  onColumnResize?: (column: IColumnDefinition, size: number) => void;

  /**
   * Called when a column is sorted
   * @param columnId The id of the sorted column
   * @param ascending When true column is sorted ascending, when false it is sorted descending, when null/undefined it is not sorted
   */
  onSortByColumn?: (columnId: string, IsAscending: boolean) => void;

  /**
   * Called when a columns sort is cleared
   */
  onClearSort?: () => void;

  /**
   * Called when a cell is clicked
   * @param rowData The row data for the row in which the clicked cell is present
   * @param columnDefinition The column definition for the clicked cell
   */
  onCellClick?: (rowData: Object, columnDefinition: IColumnDefinition) => void;

  /**
   * Text for sort grid ascending label
   */
  gridSortAscendingLabel?: string;

  /**
   * Text for sort grid descending label
   */
  gridSortDescendingLabel?: string;

  /**
   * Text for clear grid sort
   */
  gridClearSortLabel?: string;

  /**
   * Called when a keyboard shortcut is pressed
   * @param event The keyboard event
   * @param rowData The current selected row
   * @param columnDefinition The current selected column
   */
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>, rowData: Object, columnDefinition: IColumnDefinition) => void;
}

export interface IAbstractGridState {
  /** The coordinate at which to show a cell context menu */
  cellContextMenuCoordinate: GridCoordinate;

  /** The measured column widths in pixels */
  columnWidths: number[];

  /** The current context menu column */
  headerContextMenuIndex: number;

  /** The current selection state of the grid */
  selectionState: SelectionState;
}

/**
 * Abstract grid component which renders the grid layout and attaches the required event handlers.
 * It takes care of the functionality and event handlers, common to both the components, like sorting, context menus, column reordering and resizing,
 * and exposes the abstract methods for rendering the grid cell contents, and some properties differentiating the Grid and List usage.
 */
export abstract class AbstractGrid<P extends IAbstractGridProps, S extends IAbstractGridState> extends BaseComponent<
  P,
  S
> {
  /** The BaseGrid ref */
  public readonly baseGrid: BaseGrid;

  /** The container which measures available rendering space */
  public readonly gridWidthContainer: HTMLDivElement;

  /** A copy of column definitions to use for rendering, The overriding components may update these */
  protected columnDefinitions: IColumnDefinition[];

  /** The current target of the cell context menu */
  protected cellContextMenuTarget: HTMLElement;

  /** Used to tell BaseGrid it should perform a full render */
  private baseGridDirtyCanary: any;

  /** The current target of the header context menu */
  private headerContextMenuTarget: HTMLElement;

  /** Should we recompute column widths after update */
  private shouldRecomputeColumnSizesOnUpdate: boolean;

  /** A cached list of sorted rows */
  private sortedRows: Object[];

  /** A cached cell data, extracted from the rowData, using the column definitions, indexed by cell identifier */
  private cellDataCache: _.Dictionary<Object>;

  /** Window resize event handler */
  private throttledOnWindowResize = _.throttle(this.onWindowResize, GridConstants.RESIZE_THROTTLE);

  /** Aria attributes for the grid */
  private gridRoleAndAriaAttributes: IGridAriaAttributes;

  constructor(props: P, context?: any) {
    super(props, context);
    this.validateProps(props);

    this.baseGridDirtyCanary = this.props.dataKey || {};
    this.cellDataCache = {};
    this.columnDefinitions = this.props.columnDefinitions.slice();
    this.shouldRecomputeColumnSizesOnUpdate = false;
    this.initGridRoleAndAria();
  }

  public name(): string {
    return 'AbstractGrid';
  }

  @autobind
  protected getBaseGridDirtyCanary(): any {
    return this.baseGridDirtyCanary;
  }

  private initGridRoleAndAria() {
    this.gridRoleAndAriaAttributes = {
      role: GridConstants.GRID_ROLE
    };

    _.forEach(this.columnDefinitions, (columnDefinition: IColumnDefinition) => {
      if (this.isColumnHierarchyCell(columnDefinition)) {
        this.gridRoleAndAriaAttributes.role = GridConstants.TREEGRID_ROLE;
        return;
      }
    });
  }

  /** Returns the fill enabled flag to be used by the BaseGrid */
  protected abstract get isFillEnabled(): boolean;

  /** Returns the theme to use for styling the BaseGrid */
  protected abstract get gridTheme(): GridTheme;

  /** Returns the selection mode to be used by the BaseGrid */
  protected abstract get selectionMode(): SelectionMode;

  /** Returns the show row header flag to be used by the BaseGrid */
  protected abstract get showRowHeader(): boolean;

  /**
   * Renders a string or JSX.Element based on a piece of data (from a row) and a column definition
   * @param cellCoordinate The cell to render
   * @param extractedCellData The cell data extracted from the rowData using corresponding column definition
   * @param columnWidth The width of the column that this cell is in
   */
  protected abstract getRenderedElement(
    cellCoordinate: GridCoordinate,
    extractedCellData: any,
    columnWidth: number
  ): JSX.Element | string;

  /**
   * Handler to decide if a cell is editable
   * @param cellCoordinate The cell to check
   * @returns Is this cell editable?
   */
  protected abstract isCellEditable(cellCoordinate: GridCoordinate): boolean;

  /** Returns the row header width to be used by the BaseGrid, @default 50 */
  protected get rowHeaderWidth(): number {
    return GridDefaultProps.RowHeaderWidth;
  }

  /*---------------------
    |                     |
    | RENDERING/LIFECYCLE |
    |                     |
    ---------------------*/

  /**
   * Render the BaseGrid component and pass through all required props
   */
  protected renderComponent(): JSX.Element {
    const {
      ariaLabel,
      headerClassName,
      headerRowHeight,
      hideColumnHeader,
      isHeaderSticky,
      placeholderText,
      rowHeight,
      virtualizationMode
    } = this.props;

    const { cellContextMenuCoordinate, columnWidths, headerContextMenuIndex, selectionState } = this.state;

    let baseGrid: JSX.Element;
    if (columnWidths) {
      if (this.sortedRows.length === 0) {
        baseGrid = (
          <BaseGrid
            gridAriaRoleAndAriaAttributes={this.gridRoleAndAriaAttributes}
            headerRowHeight={headerRowHeight}
            headerClassName={headerClassName}
            gridAriaLabel={ariaLabel}
            gridClassName={this.getGridClassName()}
            numColumns={1}
            dirtyCanary={this.baseGridDirtyCanary}
            columnHeaderCellClassName={this.getColumnHeaderCellClassName}
            columnWidths={[columnWidths.reduce((a: number, b: number) => a + b, 0)]}
            numRows={1}
            onRenderCell={() => placeholderText}
            onRenderRowHeaderCell={this.showRowHeader && this.renderRowHeaderCell}
            rowHeaderWidth={this.rowHeaderWidth}
            cellClassName="grid-empty"
            selectionState={selectionState}
          />
        );
      } else {
        baseGrid = (
          <div>
            <BaseGrid
              gridAriaRoleAndAriaAttributes={this.gridRoleAndAriaAttributes}
              ref={this.resolveRef(this, 'baseGrid')}
              // Rendering information
              cellAriaAndDataAttributes={this.getCellAriaAndDataAttributes}
              cellClassName={this.getCellClassName}
              columnHeaderCellClassName={this.getColumnHeaderCellClassName}
              columnWidths={columnWidths}
              dirtyCanary={this.baseGridDirtyCanary}
              getColumnKey={this.getColumnKey}
              getRowKey={this.getRowKey}
              getRowSpan={this.getRowSpan}
              gridAriaLabel={ariaLabel}
              gridClassName={this.getGridClassName()}
              headerClassName={headerClassName}
              numColumns={this.columnDefinitions.length}
              numRows={this.sortedRows.length}
              rowAriaAndDataAttributes={this.getRowAriaAndDataAttributes}
              rowClassName={this.getRowClassName}
              headerRowHeight={headerRowHeight}
              rowHeight={rowHeight}
              rowHeaderWidth={this.rowHeaderWidth}
              selectionState={selectionState}
              theme={this.gridTheme}
              // Feature flags
              isCellEditable={this.isCellEditable}
              isColumnDraggable={this.getIsColumnDraggable}
              isColumnHeaderClickable={this.getIsColumnHeaderClickable}
              isColumnResizable={this.getIsColumnResizable}
              isColumnSelectable={this.getIsColumnSelectable}
              isFillEnabled={this.shouldShowFillHandle()}
              isHeaderSticky={isHeaderSticky}
              selectionMode={this.selectionMode}
              virtualized={virtualizationMode !== VirtualizationMode.None}
              getIsColumnHierarchyCell={this.getIsColumnHierarchyCell}
              // Event handlers
              onCellClick={this.onCellClick}
              onCellRightClick={this.onCellRightClick}
              onCellMouseDown={this.onCellMouseDown}
              onCellMouseEnter={this.onCellMouseEnter}
              onCellMouseUp={this.onCellMouseUp}
              onColumnReorder={this.onColumnReorder}
              onColumnResize={this.onColumnResize}
              onFillMouseDown={this.onFillMouseDown}
              onFillMouseUp={this.onFillMouseUp}
              onRowHeaderRightClick={this.onRowHeaderRightClick}
              onRowHeaderMouseDown={this.onRowHeaderMouseDown}
              onRowHeaderMouseEnter={this.onRowHeaderMouseEnter}
              onRowHeaderMouseUp={this.onRowHeaderMouseUp}
              onKeyDown={this.onKeyDown}
              onKeyUp={this.onKeyUp}
              onKeyPress={this.onKeyPress}
              onRenderCell={this.renderCell}
              onRenderColumnHeaderCell={!hideColumnHeader && this.renderColumnHeaderCell}
              onRenderRowHeaderCell={this.showRowHeader && this.renderRowHeaderCell}
            />
            {this.renderHeaderContextMenu(this.columnDefinitions, headerContextMenuIndex)}
            {this.renderCellContextMenu(cellContextMenuCoordinate)}
            {this.renderValidationError()}
          </div>
        );
      }
    }

    return (
      <div
        className={css('grid-width-container', {
          'virtualized-self': virtualizationMode === VirtualizationMode.Self,
          'virtualized-parent': virtualizationMode === VirtualizationMode.ScrollableParent
        })}
        ref={this.resolveRef(this, 'gridWidthContainer')}
      >
        {baseGrid}
      </div>
    );
  }

  /**
   * Validate any new props, update the columnDefs, selectionState if new passed in the props
   */
  public componentWillReceiveProps(nextProps: P) {
    this.validateProps(nextProps);

    // Update stored columnDefinitions from props
    this.columnDefinitions = nextProps.columnDefinitions.slice();

    // Recompute the column sizes on update
    this.shouldRecomputeColumnSizesOnUpdate = true;

    // If column definitions changed, reset the selection state and update the column widths in the state
    if (this.didColumnDefinitionsChange(nextProps)) {
      this.setState({ selectionState: GridConstants.DEFAULT_SELECTION_STATE });
      this.updateColumnWidths();
    }

    if (
      /**
       * If data key is being used and has changed re-render all cells
       * Otherwise expect immutable props to be passed in and shallow
       * comparisons will show that the object graph has changed.
       */
      (nextProps.dataKey ? nextProps.dataKey !== this.props.dataKey : nextProps !== this.props) ||
      nextProps.rowData.length !== this.props.rowData.length ||
      !_.isEqual(nextProps.sortState, this.props.sortState) ||
      !_.isEqual(nextProps.columnDefinitions, this.props.columnDefinitions)
    ) {
      // Cache the sorted rows
      this.sortedRows = this.getRowData(nextProps);
      // Clear the cached cell data
      this.cellDataCache = {};

      // Reset the canary to force a full render
      this.baseGridDirtyCanary = nextProps.dataKey || {};
    }

    this.adjustSelectionsToFit();
  }

  /**
   * Get an initial sort of the data and cache it for rendering later
   */
  public componentWillMount() {
    this.sortedRows = this.getRowData(this.props);
  }

  public componentDidMount() {
    this.events.on(window, 'resize', this.throttledOnWindowResize);
    this.updateColumnWidths();
  }

  public componentDidUpdate() {
    if (this.shouldRecomputeColumnSizesOnUpdate) {
      this.updateColumnWidths();
      this.shouldRecomputeColumnSizesOnUpdate = false;
    }
  }

  /**
   * Render header delegate for a column
   * Extracts label from the header definition and renders a chevron if the column is sorted
   * @param columnIndex The column to render the header for
   */
  @autobind
  protected renderColumnHeaderCell(columnIndex: number): JSX.Element {
    let column: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
    let arrowClassMapping: IDictionary = this.getColumnSortIcon(column.id);

    return (
      <div className="grid-column-header-cell-content-parts">
        <div>
          {arrowClassMapping && <i className={css('ms-Icon', arrowClassMapping)} />}
          {column.header.label}
        </div>
        {/* Render the context menu icon if enabled */
        this.getIsColumnHeaderClickable(columnIndex) && (
          <div
            className="grid-column-header-context-menu-indicator"
            onClick={(event: React.MouseEvent<HTMLElement>) => this.onColumnHeaderMenuClick(columnIndex, event)}
            role="menuitem"
          >
            <i className={`ms-Icon ms-Icon--${Icons.ChevronDownMed}`} />
          </div>
        )}
      </div>
    );
  }

  /**
   * Gets the css classes for the column sort icon
   * @param columnId The id of the column being sorted
   */
  private getColumnSortIcon(columnId: string): IDictionary {
    const { sortState } = this.props;

    if (sortState && sortState.columnId === columnId) {
      let cssProperties: IDictionary = {};
      cssProperties[`ms-Icon--${Icons.SortUp}`] = sortState.isAscending;
      cssProperties[`ms-Icon--${Icons.SortDown}`] = !sortState.isAscending;
      return cssProperties;
    }

    return null;
  }

  /**
   * Render cell delegate. Extracts the row data and column definition and returns the rendered result
   * @param cellCoordinate The cell to render data for
   * @param columnWidth The width of the column that this cell is in
   */
  @autobind
  protected renderCell(cellCoordinate: GridCoordinate, columnWidth: number): JSX.Element | string {
    let rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
    let cellData: any = this.extractCellData(rowData, columnDefinition);
    return this.getRenderedElement(cellCoordinate, cellData, columnWidth);
  }

  /**
   * Render the context menu for the header if it is open
   */
  protected renderHeaderContextMenu(
    columnDefinitions: IColumnDefinition[],
    headerContextMenuIndex: number
  ): JSX.Element {
    if (headerContextMenuIndex != null) {
      let columnDefinition = this.getColumnDefinitionAtIndex(headerContextMenuIndex);
      let contextMenuItems = this.getHeaderContextMenuItems(columnDefinition);
      return (
        <ContextualMenu
          items={contextMenuItems}
          onDismiss={() => this.closeHeaderContextMenu()}
          target={this.headerContextMenuTarget}
          directionalHint={!getRTL() ? DirectionalHint.bottomRightEdge : DirectionalHint.bottomLeftEdge}
        />
      );
    }
  }

  /**
   * Render the context menu for a cell if it is open
   */
  protected renderCellContextMenu(cellContextMenuCoordinate: GridCoordinate): JSX.Element {
    if (cellContextMenuCoordinate) {
      let contextMenuItems = this.getCellContextMenuItemsFromCoordinate(cellContextMenuCoordinate);
      return (
        <ContextualMenu
          className={'grid-context-menu'}
          items={contextMenuItems}
          onDismiss={() => this.closeCellContextMenu()}
          target={this.cellContextMenuTarget}
        />
      );
    }
  }

  /**
   * Render the current validation error in a callout above the cell
   */
  @autobind
  protected renderValidationError(): JSX.Element {
    return null;
  }

  /**
   * Render header delegate for a row
   * @param rowIndex The index of the row for which to render the header cell
   */
  @autobind
  protected renderRowHeaderCell(rowIndex: number): JSX.Element | string {
    return null;
  }

  /**
   * Get the context menu items for a cell
   * @param cellCoordinate The cell to render context menu items for
   * @returns Context menu items or undefined
   */
  protected getCellContextMenuItemsFromCoordinate(cellCoordinate: GridCoordinate): IContextualMenuItem[] {
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
    const row: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);

    const contextMenuItems: IContextualMenuItem[] = PropUtils.getValueFromAccessor(
      columnDefinition.cell.contextMenuItems,
      row
    );
    return contextMenuItems;
  }

  /**
   * Get the context menu items for a header
   * Adds the sort items if applicable
   * @param columnDefinition The column to get items for
   * @returns The header context menu items or an empty list
   */
  protected getHeaderContextMenuItems(columnDefinition: IColumnDefinition): IContextualMenuItem[] {
    const { sortState } = this.props;

    let items: IContextualMenuItem[] = [];

    const sortAscendingItem: IContextualMenuItem = {
      key: 'asc',
      name: this.props.gridSortAscendingLabel,
      icon: Icons.SortUp,
      onClick: () => this.onSortClicked(columnDefinition, true)
    };

    const sortDescendingItem: IContextualMenuItem = {
      key: 'dsc',
      name: this.props.gridSortDescendingLabel,
      icon: Icons.SortDown,
      onClick: () => this.onSortClicked(columnDefinition, false)
    };

    const clearSort: IContextualMenuItem = {
      key: 'clear',
      name: this.props.gridClearSortLabel,
      onClick: () => this.onClearSortClicked()
    };

    // Get the sort context menu items
    if (columnDefinition.sortable) {
      if (sortState && sortState.columnId === columnDefinition.id) {
        if (sortState.isAscending) {
          items.push(sortDescendingItem);
        } else {
          items.push(sortAscendingItem);
        }
        items.push(clearSort);
      } else {
        items.push(sortAscendingItem, sortDescendingItem);
      }
    }

    // Add the custom items if they exist
    if (columnDefinition.header.contextMenuItems) {
      // Add a divider only if there are already items in the menu
      if (items.length > 0) {
        items.push({
          key: 'divider_1',
          name: '-'
        });
      }

      items.push(...columnDefinition.header.contextMenuItems);
    }

    return items;
  }

  /*----------------
    |                |
    | MOUSE HANDLERS |
    |                |
    ----------------*/

  /**
   * Handler for the mousedown event on any cell
   * @param cellCoordinate The cell that fired the event
   */
  @autobind
  protected onCellMouseDown(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /**
   * Handler for the mouseenter event on any cell
   * @param cellCoordinate The cell that fired the event
   */
  @autobind
  protected onCellMouseEnter(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the mouseup event. Fired when the mouseup event occurs after a cell mousedown event */
  @autobind
  protected onCellMouseUp(event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the mousedown event on the fill handle */
  @autobind
  protected onFillMouseDown(event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the mouseup event after a fill operation */
  @autobind
  protected onFillMouseUp(event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /**
   * Click handler for a cell
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  @autobind
  protected onCellClick(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { onCellClick } = this.props;

    if (onCellClick) {
      const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
      const rowData: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);

      this.props.onCellClick(rowData, columnDefinition);
    }
  }

  /**
   * Right click handler for a cell
   * If the cell has any context menu items defined for it, this method will open the context menu for that cell
   * @param cellCoordinate The right clicked cell
   * @param event The right click event
   */
  @autobind
  protected onCellRightClick(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const cellContextMenuItems: IContextualMenuItem[] = this.getCellContextMenuItemsFromCoordinate(cellCoordinate);

    if (cellContextMenuItems && cellContextMenuItems.length > 0) {
      event.preventDefault();
      this.cellContextMenuTarget = event.target as HTMLElement;
      this.setState((prevState: S) => {
        prevState.cellContextMenuCoordinate = cellCoordinate;
        return prevState;
      });
    }
  }

  /**
   * Right click handler for context menu on row header
   * @param rowIndex Index of row that was right clicked
   * @param event The right click event
   */
  @autobind
  protected onRowHeaderRightClick(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    return; // Intentionally left blank for Grid / List to consume
  }

  /**
   * Click and right click handler for a column header cell.
   * If the header has any context menu items, this method will open the context menu for the header
   * @param columnIndex The column index of the clicked header
   * @param event The click event
   */
  @autobind
  protected onColumnHeaderMenuClick(columnIndex: number, event: React.MouseEvent<HTMLElement>): void {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
    if (this.getHeaderContextMenuItems(columnDefinition).length > 0) {
      event.preventDefault();
      this.headerContextMenuTarget = event.currentTarget as HTMLElement;

      while (!this.headerContextMenuTarget.classList.contains('grid-column-header-cell')) {
        this.headerContextMenuTarget = this.headerContextMenuTarget.parentElement;
        // break out of loop if we hit the highest element the element we are looking for could be contained in
        if (this.headerContextMenuTarget === this.baseGrid.headerRowRef.innerDiv) {
          return;
        }
      }

      this.setState((prevState: S) => {
        prevState.headerContextMenuIndex = columnIndex;
        return prevState;
      });
    }
  }

  /**
   * Handler for the mousedown event on row header cell
   * @param rowIndex The row index where the event was fired
   * @param event The associate event
   */
  @autobind
  protected onRowHeaderMouseDown(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /**
   * Handler for the mouseenter event on row header cell
   * @param rowIndex The row index where the event was fired
   * @param event The associate event
   */
  @autobind
  protected onRowHeaderMouseEnter(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /**
   * Handler for the mouseup event. Fired when the mouseup event occurs after a mousedown event on a row Header cell
   * @param event The associate event
   */
  @autobind
  protected onRowHeaderMouseUp(event: React.MouseEvent<HTMLElement>): void {
    return;
  }

  /*-------------------
    |                   |
    | KEYBOARD HANDLERS |
    |                   |
    -------------------*/

  /**
   * Capture the keyUp event, and update the grid state depending on the key
   */
  protected onKeyUp(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /**
   * Capture the keydown event, and update the grid state depending on the key
   */
  @autobind
  protected onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const { onKeyDown } = this.props;

    const { selectionState } = this.state;

    // Pass the event up to the consumer if a handler was provided.
    if (onKeyDown) {
      onKeyDown(
        event,
        this.getRowDataAtIndex(selectionState.primaryCell.rowIndex),
        this.getColumnDefinitionAtIndex(selectionState.primaryCell.columnIndex)
      );
    }

    // see if the consumer handled and stopped propagation
    if (event.isPropagationStopped && event.isPropagationStopped()) {
      return;
    }

    switch (getRTLSafeKeyCode(event.keyCode)) {
      case KeyCode.DELETE:
        this.handleDeleteKeyDown(event);
        break;
      case KeyCode.ESCAPE:
        this.handleEscapeKeyDown(event);
        break;
      case KeyCode.ENTER:
        this.handleEnterKeyDown(event);
        break;
      case KeyCode.F2:
        this.handleF2KeyDown(event);
        break;
      case KeyCode.TAB:
        this.handleTabKeyDown(event);
        break;
      case KeyCode.HOME:
        this.handleHomeKeyDown(event);
        break;
      case KeyCode.END:
        this.handleEndKeyDown(event);
        break;
      case KeyCode.LEFT_ARROW:
        this.handleLeftArrowKeyDown(event);
        break;
      case KeyCode.RIGHT_ARROW:
        this.handleRightArrowKeyDown(event);
        break;
      case KeyCode.UP_ARROW:
        this.handleUpArrowKeyDown(event);
        break;
      case KeyCode.DOWN_ARROW:
        this.handleDownArrowKeyDown(event);
        break;
    }
  }

  /** Handler for the keyPress event */
  protected onKeyPress(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Delete key down event */
  protected handleDeleteKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Escape key down event */
  protected handleEscapeKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Home key down event */
  protected handleHomeKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the End key down event */
  protected handleEndKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Enter key down event */
  protected handleEnterKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the F2 key down event */
  protected handleF2KeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Tab key down event */
  protected handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Left Arrow key down event */
  protected handleLeftArrowKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Right Arrow key down event */
  protected handleRightArrowKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Up Arrow key down event */
  protected handleUpArrowKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for the Down Arrow key down event */
  protected handleDownArrowKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    return;
  }

  /** Handler for column header alt down event
   * @param columnIndex Index of the column
   * @param event Base HTML keyboard event
   */
  @autobind
  protected onColumnHeaderAltDown(columnIndex: number, event: React.KeyboardEvent<HTMLElement>): void {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);

    if (this.getHeaderContextMenuItems(columnDefinition).length > 0) {
      event.preventDefault();

      const headerCell = event.currentTarget
        .getElementsByClassName('grid-column-header-cell-content-parts')
        .item(columnIndex) as HTMLElement;
      this.headerContextMenuTarget = (headerCell
        ? headerCell.getElementsByClassName('grid-column-header-context-menu-indicator').item(0)
        : null) as HTMLElement;

      while (
        this.headerContextMenuTarget &&
        !this.headerContextMenuTarget.classList.contains('grid-column-header-cell')
      ) {
        this.headerContextMenuTarget = this.headerContextMenuTarget.parentElement;
        // break out of loop if we hit the highest element the element we are looking for could be contained in
        if (this.headerContextMenuTarget === this.baseGrid.headerRowRef.innerDiv) {
          return;
        }
      }

      this.setState((prevState: S) => {
        prevState.headerContextMenuIndex = columnIndex;
        return prevState;
      });
    }
  }

  /*---------------
    |               |
    | MISC HANDLERS |
    |               |
    ---------------*/

  /**
   * Called when a column is resized
   * Translates the column index into a column definition and calls the onColumnResize handler
   * @param columnIndex The resized column
   * @param newSize The new size of the colum in pixels
   */
  @autobind
  protected onColumnResize(columnIndex: number, newSize: number): void {
    const { onColumnResize } = this.props;

    if (onColumnResize) {
      let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
      onColumnResize(columnDefinition, newSize);
    }
  }

  /**
   * Called when a column is re-ordered
   * Translates the column index into a column definition and calls the onColumnReorder handler
   * @param previousIndex The column that was moved
   * @param newIndex The new location of the column
   */
  @autobind
  protected onColumnReorder(previousIndex: number, newIndex: number): void {
    const { onColumnReorder } = this.props;

    if (onColumnReorder) {
      let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(previousIndex);
      onColumnReorder(columnDefinition, newIndex);
    }
  }

  /**
   * Called when a sort context menu item is called
   * Sets the sort state of the Grid to the clicked column and direction, and clears the selection
   * @param ColumnDefinition The column definition on which the sort item was clicked
   * @param ascending Should sort ascending
   */
  protected onSortClicked(columnDefinition: IColumnDefinition, ascending: boolean): void {
    if (columnDefinition.sortable) {
      this.props.onSortByColumn(columnDefinition.id, ascending);
    }
  }

  /**
   * Called when a clear sort context menu item is called
   * Resets the sort state of the Grid to unsorted
   */
  protected onClearSortClicked(): void {
    this.props.onClearSort();
  }

  /**
   * Window resize handler
   */
  protected onWindowResize(): void {
    this.baseGridDirtyCanary = {};
    this.updateColumnWidths();
  }

  /*---------
    |         |
    | HELPERS |
    |         |
    ---------*/

  /**
   * Add a row to the internal in-memory row container if grid is not sorted
   * @param newRow Row in add
   */
  protected appendRowData(newRow: Object): void {
    this.sortedRows = _.concat(this.sortedRows, newRow);
  }

  /**
   * Set the state of the context menu for the cell to hidden
   */
  protected closeCellContextMenu(): void {
    this.cellContextMenuTarget = null;
    this.setState((prevState: S) => {
      prevState.cellContextMenuCoordinate = null;
      return prevState;
    });
  }

  /**
   * Sets the header context menu state to hidden
   */
  protected closeHeaderContextMenu(): void {
    this.headerContextMenuTarget = null;
    this.setState((prevState: S) => {
      prevState.headerContextMenuIndex = null;
      return prevState;
    });
  }

  /**
   * Returns the context for a given cell
   * @param cellCoordinate The coordinates of the cell in the grid
   * @param columnWidth The width of the column that this cell is in
   */
  protected getCellContext(cellCoordinate: GridCoordinate, columnWidth: number): CellContext {
    const { selectionState } = this.state;

    return {
      columnWidth: columnWidth,
      coordinate: cellCoordinate,
      isEditable: (passedCellCoordinate: GridCoordinate) => this.isCellEditable(cellCoordinate),
      isPrimary: (passedCellCoordinate: GridCoordinate) => cellCoordinate.equals(selectionState.primaryCell),
      isSelected: (passedCellCoordinate: GridCoordinate) =>
        GridUtilities.isCellInsideAnySelection(cellCoordinate, selectionState.selections),
      isSelectionSingleCell: () =>
        selectionState.selections.length === 1 && selectionState.selections[0].isSingleCell(),
      inFooterRow: false,
      theme: this.gridTheme
    };
  }

  /**
   * Get the aria label for a cell
   * Translates cellCoordinate into row and column definition and uses
   * the getAriaAndDataAttributes defined on the column definition type
   * @param cellCoordinate The cell to get the aria label for
   */
  @autobind
  protected getCellAriaAndDataAttributes(cellCoordinate: GridCoordinate): _.Dictionary<string> {
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
    if (columnDefinition.cell.type.getAriaAndDataAttributes) {
      const row: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);
      let cellData: any = this.extractCellData(row, columnDefinition);
      return columnDefinition.cell.type.getAriaAndDataAttributes(cellData);
    }
  }

  /**
   * Get the class name for a cell
   * @param cellCoordinate The cell to get the class name for
   */
  @autobind
  protected getCellClassName(cellCoordinate: GridCoordinate): string {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
    let row: Object = this.getRowDataAtIndex(cellCoordinate.rowIndex);

    return css(
      PropUtils.getValueFromAccessor(columnDefinition.cell.className, row),
      this.getContentAlignmentClassName(columnDefinition.cell.contentAlignment)
    );
  }

  /**
   * Returns the class name to be used by the grid
   */
  @autobind
  protected getGridClassName(): string {
    const { className } = this.props;

    return className;
  }

  /**
   * Get a class name from the content alignment enum
   * @param contentAlignment The content alignment @default Left
   */
  protected getContentAlignmentClassName(contentAlignment: ContentAlignment = ContentAlignment.Left): IDictionary {
    return {
      'align-left': contentAlignment === ContentAlignment.Left,
      'align-center': contentAlignment === ContentAlignment.Center,
      'align-right': contentAlignment === ContentAlignment.Right
    };
  }

  /**
   * Get a key representing this cell
   * @param rowData The row data
   * @param columnDefinition The column definition
   */
  @autobind
  protected getCellIdentifier(rowData: Object, columnDefinition: IColumnDefinition): string {
    const { rowKey } = this.props;

    return rowKey(rowData) + '_' + columnDefinition.id;
  }

  /**
   * Get the column index at the provided index
   * @param columnIndex The column index
   */
  @autobind
  protected getColumnDefinitionAtIndex(columnIndex: number): IColumnDefinition {
    return this.columnDefinitions[columnIndex];
  }

  /**
   * Get the key for a column
   * Returns the id for the column definition at this index
   * @param The column index to get the key for
   */
  @autobind
  protected getColumnKey(columnIndex: number): string {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
    return columnDefinition.id;
  }

  /**
   * Get the class name for the column header cell
   * @param columnIndex The column index of the header cell
   */
  @autobind
  protected getColumnHeaderCellClassName(columnIndex: number): string {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);

    return css(
      columnDefinition.header.className,
      this.getContentAlignmentClassName(columnDefinition.header.contentAlignment)
    );
  }

  /**
   * Get the draggable property for a column from its definition
   */
  @autobind
  protected getIsColumnDraggable(columnIndex: number): boolean {
    return this.getColumnDefinitionAtIndex(columnIndex).draggable;
  }

  /**
   * Is the column header clickable?
   * @param columnIndex The column to check
   */
  @autobind
  protected getIsColumnHeaderClickable(columnIndex: number): boolean {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
    return (
      columnDefinition.sortable ||
      (columnDefinition.header.contextMenuItems && columnDefinition.header.contextMenuItems.length > 0)
    );
  }

  /**
   * Get the resizable property for a column from its definition
   */
  @autobind
  protected getIsColumnResizable(columnIndex: number): boolean {
    return this.getColumnDefinitionAtIndex(columnIndex).resizable;
  }

  /**
   * Get the selectable property for a column from its definition
   */
  @autobind
  protected getIsColumnSelectable(columnIndex: number): boolean {
    return this.getColumnDefinitionAtIndex(columnIndex).selectable;
  }

  /**
   * Determine if a column represents a hierarchy cell from its definition
   */
  @autobind
  protected getIsColumnHierarchyCell(columnIndex: number): boolean {
    return this.isColumnHierarchyCell(this.getColumnDefinitionAtIndex(columnIndex));
  }

  /**
   * Check if the grid is sorted
   * @param {IAbstractGridProps} [props=this.props] The props for the grid
   * @returns {boolean} True if the grid is sorted
   */
  protected isGridSorted(props: P = this.props): boolean {
    let { sortState } = props;

    return sortState != null && sortState.columnId !== undefined;
  }

  /**
   * Get the max row index for this grid
   */
  @autobind
  protected getMaxRowIndex(): number {
    // Sorted rows contains the mutated row data including any extra rows the grid may add
    return Math.max(this.sortedRows.length - 1, 0);
  }

  /**
   * Get the max column index for this grid
   */
  @autobind
  protected getMaxColumnIndex(): number {
    return Math.max(this.columnDefinitions.length - 1, 0);
  }

  /** Get the min selectable column index. Will return column count if not found */
  @autobind
  protected getMinSelectableColumnIndex(): number {
    let minIndex: number = 0;
    let maxIndex: number = this.getMaxColumnIndex();

    // isSelectionEnabled is only configurable per column and not per cell or row
    while (minIndex <= maxIndex && !this.getIsColumnSelectable(minIndex)) {
      minIndex++;
    }

    return minIndex;
  }

  /** Get the max selectable column index. Will return -1 if none can be found. */
  @autobind
  protected getMaxSelectableColumnIndex(): number {
    let maxIndex: number = this.getMaxColumnIndex();

    // isSelectionEnabled is only configurable per column and not per cell or row
    while (maxIndex >= 0 && !this.getIsColumnSelectable(maxIndex)) {
      maxIndex--;
    }

    return maxIndex;
  }

  /**
   * Get the mapped cell corresponding to a given cell.
   * If the rowSpan for the column is 1, it would return the same cell,
   * else returns the row-spanned cell to which the given cell should be mapped to
   */
  @autobind
  protected getMappedCell(cell: GridCoordinate): GridCoordinate {
    let columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cell.columnIndex);

    if (columnDefinition.rowSpan && columnDefinition.rowSpan !== 1) {
      return new GridCoordinate(cell.rowIndex - (cell.rowIndex % columnDefinition.rowSpan), cell.columnIndex);
    }

    return cell;
  }

  /**
   * Get the ARIA attributes for a row
   * Translates rowIndex to a row and calls the rowAriaAndDataAttributes accessor
   * @param rowIndex The row index
   */
  @autobind
  protected getRowAriaAndDataAttributes(rowIndex: number): _.Dictionary<string> {
    const { rowAriaAndDataAttributes } = this.props;

    if (rowAriaAndDataAttributes) {
      const row: Object = this.getRowDataAtIndex(rowIndex);
      return PropUtils.getValueFromAccessor(rowAriaAndDataAttributes, row) as _.Dictionary<string>;
    }
  }

  /**
   * Get the class name for a row
   * Translates rowIndex to a row and calls the rowClassName accessor
   * @param rowIndex The row index
   */
  @autobind
  protected getRowClassName(rowIndex: number): string {
    const { rowClassName } = this.props;

    if (rowClassName) {
      const row: Object = this.getRowDataAtIndex(rowIndex);
      return PropUtils.getValueFromAccessor(rowClassName, row) as string;
    }
  }

  /**
   * Get the row data
   */
  @autobind
  protected getRowData(props: P = this.props) {
    return props.rowData;
  }

  /**
   * Get the row data at the provided index
   * @param rowIndex The row index
   */
  @autobind
  protected getRowDataAtIndex(rowIndex: number): Object {
    return this.sortedRows[rowIndex];
  }

  /**
   * Get the key for a row.
   * Uses the rowKey prop or just returns the index as a string
   * @param rowIndex The row index to get the key for
   */
  @autobind
  protected getRowKey(rowIndex: number): string {
    const { rowKey } = this.props;

    const rowData: Object = this.getRowDataAtIndex(rowIndex);
    let userDefinedKey: string = rowKey && rowKey(rowData);
    return userDefinedKey || rowIndex.toString();
  }

  /**
   * Get the row span for a cell.
   * Translates coorindate to a column definition and uses the rowSpan defined there
   * If the coordinate is within another cell, returns undefined
   * @param cellCoordinate The cell whose rowspan to get
   */
  @autobind
  protected getRowSpan(cellCoordinate: GridCoordinate): number {
    const columnDefinition: IColumnDefinition = this.getColumnDefinitionAtIndex(cellCoordinate.columnIndex);
    if (columnDefinition.rowSpan && cellCoordinate.rowIndex % columnDefinition.rowSpan === 0) {
      return columnDefinition.rowSpan;
    } else if (!columnDefinition.rowSpan) {
      return 1;
    }
  }

  /**
   * Returns the cell data extracted from the row data using column definition
   * @param rowData The row data for the row in which the cell is present
   * @param columnDefinition The column definition for the cell column
   */
  protected extractCellData(rowData: any, columnDefinition: IColumnDefinition): any {
    if (!rowData) {
      return;
    }

    if (!rowData[GridConstants.__FOOTER_ROW_KEY] === true) {
      let cellIdentifier: string = this.getCellIdentifier(rowData, columnDefinition);
      // update the cached data if not already cached, and return the cached data
      if (this.cellDataCache[cellIdentifier] === undefined) {
        this.cellDataCache[cellIdentifier] = GridUtilities.getDataFromColumnDefinition(rowData, columnDefinition);
      }

      return this.cellDataCache[cellIdentifier];
    }

    return null;
  }

  /**
   * Should we show the fill handle?
   */
  protected shouldShowFillHandle(): boolean {
    const { selectionState } = this.state;

    // should not show fill handle, if fill handle not enabled or more than one region selected
    if (!this.isFillEnabled || !selectionState.selections || selectionState.selections.length !== 1) {
      return false;
    }

    // all the columns should be editable and have same rowSpan to show fill handle
    let firstSelectedColumnIndex = selectionState.selections[0].columnRange.start;
    let firstColumnDefinition = this.getColumnDefinitionAtIndex(firstSelectedColumnIndex);
    let selectionRowSpan = firstColumnDefinition.rowSpan;
    return _.every(
      _.range(selectionState.selections[0].columnRange.start, selectionState.selections[0].columnRange.end + 1),
      (columnIndex: number) => {
        let columnDefinition = this.getColumnDefinitionAtIndex(columnIndex);
        return columnDefinition.editable && columnDefinition.rowSpan === selectionRowSpan;
      }
    );
  }

  /** Is the given column definition representing a hierarchy cell */
  private isColumnHierarchyCell(columnDefinition: IColumnDefinition) {
    return columnDefinition.cell.type instanceof HierarchyCell;
  }

  /**
   * Check each selection to keep it inside the boundaries of the grid
   */
  private adjustSelectionsToFit() {
    const { selectionState } = this.state;

    if (selectionState && _.size(selectionState.selections)) {
      let newSelectionState: SelectionState = selectionState;
      let finalRowIndex: number = this.getMaxRowIndex();

      for (let i: number = selectionState.selections.length - 1; i >= 0; i--) {
        // get upper left and lower right coordinates
        let currentRegion: GridRegion = selectionState.selections[i];
        let primaryCoordinateRowIndex: number =
          currentRegion && currentRegion.primaryCoordinate && currentRegion.primaryCoordinate.rowIndex;
        let secondaryCoordinateRowIndex: number =
          currentRegion && currentRegion.secondaryCoordinate && currentRegion.secondaryCoordinate.rowIndex;

        let topRowIndex: number = Math.min(primaryCoordinateRowIndex, secondaryCoordinateRowIndex);
        let bottomRowIndex: number = Math.max(primaryCoordinateRowIndex, secondaryCoordinateRowIndex);

        if (Math.max(topRowIndex, bottomRowIndex) > finalRowIndex) {
          // clone if selectionState hasn't been cloned yet
          if (selectionState === newSelectionState) {
            newSelectionState = _.cloneDeep(selectionState);
          }

          if (topRowIndex > finalRowIndex) {
            newSelectionState = this.removeRegion(newSelectionState, i);
          } else if (bottomRowIndex > finalRowIndex) {
            newSelectionState = this.shrinkRegion(newSelectionState, newSelectionState.selections[i], finalRowIndex);
          }
        }
      }

      if (selectionState !== newSelectionState) {
        this.setState({
          selectionState: newSelectionState
        });
      }
    }
  }

  /**
   * Remove a selected region from selection state
   * @param selectionState Grid selection state
   * @param regionIndex Index of the current region in the selections array
   */
  private removeRegion(selectionState: SelectionState, regionIndex: number): SelectionState {
    if (selectionState.selections[regionIndex].isCellInRegion(selectionState.primaryCell)) {
      if (regionIndex > 0) {
        // Move primary cell to previous region's primary coordinate
        selectionState.primaryCell = selectionState.selections[regionIndex - 1].primaryCoordinate;
      } else {
        // Reset to default as no selections remain
        selectionState = GridConstants.DEFAULT_SELECTION_STATE;
      }
    }

    // remove the selection as it's outside of the grid
    selectionState.selections.splice(regionIndex, 1);

    return selectionState;
  }

  /**
   * Shrink a selected region in the selection state to fit
   * @param selectionState Grid selection state
   * @param region Region to be shrunk
   * @param finalRowIndex Index of the last row in the grid
   */
  private shrinkRegion(selectionState: SelectionState, region: GridRegion, finalRowIndex: number): SelectionState {
    let isInRegion: boolean = region.isCellInRegion(selectionState.primaryCell);

    // shrink the selection so it remains within the grid
    if (region.primaryCoordinate.rowIndex > finalRowIndex) {
      region.primaryCoordinate.rowIndex = finalRowIndex;
    } else if (region.secondaryCoordinate.rowIndex > finalRowIndex) {
      region.secondaryCoordinate.rowIndex = finalRowIndex;
    }

    // move primary cell if it belongs to this region
    if (isInRegion) {
      selectionState.primaryCell = region.primaryCoordinate;
    }

    return selectionState;
  }

  /**
   * Validates props for common configurations
   * @param props The props to validate
   */
  protected validateProps(props: IAbstractGridProps) {
    const { columnDefinitions, onColumnResize, onSortByColumn, onClearSort } = props;

    let componentName: string = this.name();

    if (columnDefinitions && columnDefinitions.length > 0) {
      _.forEach(columnDefinitions, (columnDefinition: IColumnDefinition) => {
        // Null checks
        if (columnDefinition == null) {
          throw new PropValidationError(componentName, 'columnDefinitions', 'Column definition must not be null');
        }

        if (!columnDefinition.id) {
          throw new PropValidationError(
            componentName,
            'columnDefinitions',
            'Column definition must have a non null, non empty, unique Id field'
          );
        }

        if (columnDefinition.cell == null) {
          throw new PropValidationError(
            componentName,
            'columnDefinitions',
            'Column definition must provide a cell definition. Column definition: ' + JSON.stringify(columnDefinition)
          );
        }

        if (columnDefinition.header == null) {
          throw new PropValidationError(
            componentName,
            'columnDefinition',
            'Column definition must provide a header definition. Column definition: ' + JSON.stringify(columnDefinition)
          );
        }

        if (columnDefinition.cell.type == null) {
          throw new PropValidationError(
            componentName,
            'columnDefinition',
            'Cell definition must provide a type. Column definition: ' + JSON.stringify(columnDefinition)
          );
        }

        // Validate property/accessor
        if (columnDefinition.cell.accessor && columnDefinition.cell.property) {
          throw new PropValidationError(
            componentName,
            'columnDefinition',
            'Cell definition provides both accessor delegate and property name. Only one can be used at a time. Column definition: ' +
              JSON.stringify(columnDefinition)
          );
        }

        if (!columnDefinition.cell.accessor && !columnDefinition.cell.property) {
          throw new PropValidationError(
            componentName,
            'columnDefinition',
            'Cell definition must provide either an accessor delegate or a property name. Column Definition: ' +
              JSON.stringify(columnDefinition)
          );
        }

        // Validate sort
        if (columnDefinition.sortable && (!onSortByColumn || !onClearSort)) {
          throw new PropValidationError(
            componentName,
            'columnDefinition',
            'Column definition marked as sortable, but there are no props for onColumnSort and onColumnSortClear : ' +
              JSON.stringify(columnDefinition)
          );
        }

        // Validate column resize
        if (columnDefinition.resizable && onColumnResize == null) {
          throw new PropValidationError(
            componentName,
            'onColumnResize',
            'A grid with one or more resizable columns must specify the onColumnResize prop'
          );
        }
      });

      // finding all the columns with unique "id", by iterating through the columns using _.uniqBy
      // and comparing the number of such columns with the columns in the props
      if (
        _.uniqBy(columnDefinitions, (columnDefinition: IColumnDefinition) => columnDefinition.id).length !==
        columnDefinitions.length
      ) {
        throw new PropValidationError(componentName, 'columnDefinition', 'Column definitions must contain unique ids');
      }
    } else {
      throw new PropValidationError(
        componentName,
        'columnDefinition',
        'ColumnDefinition list must not be null or empty'
      );
    }
  }

  /**
   * Measure the available space and update the computed widths of columns
   */
  private updateColumnWidths(): void {
    if (this.gridWidthContainer) {
      let availableWidth = this.gridWidthContainer.clientWidth;
      let columnWidths: number[] = this.computeColumnWidths(
        _.map(this.columnDefinitions, (columnDefinition: IColumnDefinition) =>
          GridSize.parseSize(columnDefinition.width)
        ),
        availableWidth
      );

      if (!_.isEqual(this.state.columnWidths, columnWidths)) {
        this.setState({
          columnWidths: columnWidths
        });
      }
    }
  }

  /**
   * Given a set of parsed widths, return a set of computed columns
   * @param columnWidths The parsed widths
   * @param availableWidth The total available width
   */
  private computeColumnWidths(columnWidths: GridSize[], availableWidth: number): number[] {
    let computedColumnWidths: number[] = _.times(columnWidths.length, _.constant(0));
    let totalFlexValue: number = 0;

    // Assign fixed widths
    _.forEach(columnWidths, (columnWidth: GridSize, index: number) => {
      if (columnWidth.unit === GridSizeUnit.Pixel) {
        computedColumnWidths[index] = columnWidth.value;
        availableWidth -= columnWidth.value;
      } else if (columnWidth.unit === GridSizeUnit.Flexible) {
        totalFlexValue += columnWidth.value;
      }
    });

    // Distribute the remaining width to the auto columns
    if (totalFlexValue > 0 && availableWidth > 0) {
      _.forEach(columnWidths, (columnWidth: GridSize, index: number) => {
        if (columnWidth.unit === GridSizeUnit.Flexible) {
          computedColumnWidths[index] = availableWidth * (columnWidth.value / totalFlexValue);
        }
      });
    }

    return computedColumnWidths;
  }

  /**
   * Compares the column definitions from nextProps and this.props and returns if the column definitions was changed
   * @param nextProps the new props passed to the component
   */
  private didColumnDefinitionsChange(nextProps: IAbstractGridProps): boolean {
    if (nextProps.columnDefinitions.length !== this.props.columnDefinitions.length) {
      return true;
    }
    return (
      _.find(nextProps.columnDefinitions, (columnDef: IColumnDefinition, index: number) => {
        return columnDef.id !== this.props.columnDefinitions[index].id;
      }) != null
    );
  }
}

/**
 * Defines a column for Grid
 */
export interface IColumnDefinition {
  /**
   * A unique identifier for this column
   */
  id: string;

  /**
   * A header definition which defines behavior about the header of this column
   */
  header: IHeaderDefinition;

  /**
   * A cell definition which defines behavior about the cells of this column
   */
  cell: ICellDefinition;

  /**
   * Is the column draggable for reorder?
   */
  draggable?: boolean;

  /**
   * Is the column editable?
   * Default value is false
   * In case a column is editable, one of the cell.renderEditor or cell.type.renderEditor needs to be provided along with onValueUpdated callback in the grid props
   */
  editable?: boolean;

  /**
   * Is the column resizable?
   */
  resizable?: boolean;

  /**
   * What is the row span of this column
   */
  rowSpan?: number;

  /**
   * Is this column selectable?
   */
  selectable?: boolean;

  /**
   * Is the column sortable?
   */
  sortable?: boolean;

  /**
   * Width that will be set to the columns. Can be a pixel or a flexible value. EX. 200, "200", "200px", *, 2*
   */
  width: number | string;
}

/**
 * Defines a column header for Grid
 */
export interface IHeaderDefinition {
  /**
   * Class name for this header cell
   */
  className?: string;

  /**
   * How should the header text be aligned
   * @default Left
   */
  contentAlignment?: ContentAlignment;

  /**
   * Additional context menu items to display for the header
   */
  contextMenuItems?: IContextualMenuItem[];

  /**
   * The label to display on the header
   */
  label: string;
}

/**
 * Defines a cell for a grid column
 */
export interface ICellDefinition {
  /**
   * The property name to extract from the row data. This will be used with the type
   */
  property?: string;

  /**
   * A function that can be used to retrieve the necessary data from the row object
   * The function will be called with the entire data for the row as a parameter and should return
   * the value to display for this cell.
   * This will be used with the type if the property attribute is not provided
   */
  accessor?: (rowData: Object) => any;

  /**
   * The type of data to display, the render inside the type is called with the extracted data using property or accessor
   */
  type: ICellType;

  /**
   * Additional validators to run against updated values
   * Should be an array of functions that return an error message or null
   */
  validators?: Validators.Validator[];

  /**
   * How should the content in the cell be aligned
   * @default Left
   */
  contentAlignment?: ContentAlignment;

  /**
   * Get a class name for this cell based on the row data
   */
  className?: string | ((rowData: Object) => string);

  /**
   * Context menu items to show for this cell
   */
  contextMenuItems?: IContextualMenuItem[] | ((rowData: Object) => IContextualMenuItem[]);
}

/**
 * Contextual information of a cell passed to the render methods in the cell types
 */
export type CellContext = {
  /** Width of the column that the cell is in, in pixels */
  columnWidth: number;

  /** The coordinate of the cell within the grid */
  coordinate: GridCoordinate;

  /** Is this cell part of the footer row */
  inFooterRow: boolean;

  /**
   * Returns if the cell is editable
   * @param coordinate The cell coordinate
   */
  isEditable: (coordinate: GridCoordinate) => boolean;

  /**
   * Returns if the cell is the primary cell
   * @param coordinate The cell coordinate
   */
  isPrimary: (coordinate: GridCoordinate) => boolean;

  /**
   * Returns if the cell is selected
   * @param coordinate The cell coordinate
   */
  isSelected: (coordinate: GridCoordinate) => boolean;

  /** Does the selection contain only one cell */
  isSelectionSingleCell: () => boolean;

  /** Theme of the cell for icon colors */
  theme: GridTheme;
};

/**
 * Defines the type of a cell and functions for rendering and sorting it within the grid
 */
export interface ICellType {
  /**
   * Does the cell support callout for editing, so that the grid would open it in Alt + Down
   * Ideally, this should be handled by the editor, but since we want to allow Alt + Down in Select state,
   * the grid has to listen to the event, and react to it
   * @default false
   */
  supportsCalloutForEditing?: boolean;

  /**
   * Given the data, return the aria attributes to be used for screen-readers
   * @param cellData The cell data extracted through property or accessor
   */
  getAriaAndDataAttributes?: (cellData: Object) => _.Dictionary<string>;

  /**
   * Return a JSX.Element or string in the default mode
   * @param cellData The cell data extracted through property or accessor
   * @param context The cell context which provides additional properties, usable for rendering
   */
  render: (cellData: Object, context: CellContext) => JSX.Element | string | null;

  /**
   * Return a JSX element in the edit mode
   * @param cellData The cell data extracted through property or accessor
   * @param pendingUpdate The pending update value to be used in the editor
   * @param action The user action performed on the cell e.g. type over to edit, clicking on picker icon or pressing Alt + Down to open callout etc.
   * @param onValueUpdated The delegate to be called to save pending updates
   * @param onEditCancelled The delegate to call to request the cancelling of any updates
   * @param onEditConfirmed The delegate to call to commit an update
   * @param context The cell context which provides additional properties, usable for rendering
   */
  renderEditor?: (
    cellData: Object,
    pendingUpdate: Object,
    action: GridAction,
    onValueUpdated: (updatedValue: Object) => void,
    onEditCancelled: () => void,
    onEditConfirmed: (finalValue: Object) => void,
    context: CellContext
  ) => JSX.Element;

  /**
   * Return a JSX.Element or string in the selected mode, when this is the primary cell in the selection
   * @param cellData The cell data extracted through property or accessor
   * @param transitionToEditMode The delegate to transition the grid to edit mode. Accepts optional action that would be passed to renderEditor
   * @param context The cell context which provides additional properties, usable for rendering
   */
  renderSelected?: (
    cellData: Object,
    transitionToEditMode: (action?: GridAction) => void,
    context: CellContext
  ) => JSX.Element | string;

  /**
   * Compare two extracted cell data and return the compare result
   * @param left The left data
   * @param right The right data
   */
  sortComparator?: (left: Object, right: Object) => number;

  /**
   * Returns the string representation of the cell data
   * @param cellData The cell data extracted through property or accessor
   */
  toString: (cellData: Object) => string;

  /**
   * Parses the raw input by the user
   * @param originalValue The cell data extracted through property or accessor
   * @param changedValue The raw input to parse to Object
   */
  parseRawInput?: (originalValue: Object, changedValue: Object): any => Object;

  /**
   * Validate a piece of data. Should provide some default validations for the type
   * @returns The error message or null if there is no error
   */
  validate?: Validators.Validator;
}

/** Enum representing types of content alignment */
export enum ContentAlignment {
  Left = 0,
  Center = 1,
  Right = 2
}

/**
 * The sort state.
 */
export type SortState = {
  /** The currently sorted column id */
  columnId: string;
  /** The direction of the sort */
  isAscending: boolean;
};
