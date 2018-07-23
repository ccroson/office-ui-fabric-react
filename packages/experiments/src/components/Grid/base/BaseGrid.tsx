/*tslint:disable:member-ordering*/
import './BaseGrid.scss';
import * as React from 'react';

// Lodash
import * as _ from 'lodash';

// Constants
import { GridDefaultProps, GridConstants } from '../constants/GridConstants';

// Errors
import { PropValidationError } from '../utilities/errors/Errors';

// Grid Components
import { BaseComponent } from '../utilities/BaseComponent';
import { ColumnHeaderCell } from './ColumnHeaderCell';
import { HeaderRow } from './HeaderRow';
import { HeaderContainer } from './HeaderContainer';
import { HeaderStickyContainer } from './HeaderStickyContainer';
import { Row } from './Row';
import { RowHeaderCell } from './RowHeaderCell';

// Models
import { GridCoordinate, GridMode, GridRegion, GridTheme, RowRange, SelectionMode } from '../common/Common';

// Utilities
import { autobind, css, getNativeProps, getRTL } from '../../../Utilities';
import { CSSUtils } from '../utilities/CSSUtils';
import { FixedRowPositionManager } from '../virtualization/FixedRowPositionManager';
import { IRowPositionManager, VisibilityInformation, RowBoundaries } from '../virtualization/IRowPositionManager';
import { PropUtils } from '../utilities/PropUtils';
import { RangeRenderers, RangeRenderer } from '../renderers/RangeRenderers';
import { RtlUtils } from '../utilities/RtlUtils';
import { SelectionState } from '../managers/StateManager';
import { IGridAriaAttributes } from '../common/IGridAriaAttributes';

export interface IBaseGridProps {
  /*-----------------------
    |                       |
    | RENDERING INFORMATION |
    |                       |
    -----------------------*/

  /** The aria label for the entire grid */
  gridAriaLabel?: string;

  /** The role and other aria attributes for the entire grid */
  gridAriaRoleAndAriaAttributes?: IGridAriaAttributes;

  /** A class name to append to the entire grid */
  gridClassName?: string;

  /** The aria and data attributes to apply for each row element */
  rowAriaAndDataAttributes?: _.Dictionary<string> | ((rowIndex: number) => _.Dictionary<string>);

  /** The class name to append for each row element */
  rowClassName?: string | ((rowIndex: number) => string);

  /** The aria and data attributes to apply to each cell container. It's important to note that this wraps the cell content */
  cellAriaAndDataAttributes?: _.Dictionary<string> | ((cellCoordinate: GridCoordinate) => _.Dictionary<string>);

  /** The class name to append to each cell container. It's important to note that this wraps the cell content */
  cellClassName?: string | ((cellCoordinate: GridCoordinate) => string);

  /** The class name to append to the header */
  headerClassName?: string;

  /** The class name to append to each column header cell */
  columnHeaderCellClassName?: string | ((columnIndex: number) => string);

  /** The class name to append to each row header cell */
  rowHeaderCellClassName?: string | ((rowIndex: number) => string);

  /** Returns the number of rows that a cell spans */
  getRowSpan?: (cellCoordinate: GridCoordinate) => number;

  /**
   * The cell renderer. Should return any data you want to display in the grid
   * @param cellCoordinate The coordinate of the cell to render
   * @param columnWidth The width of the column that this cell is in
   * @returns Either a string or a JSX.Element to display in the cell
   */
  onRenderCell: (cellCoordinate: GridCoordinate, columnWidth: number) => JSX.Element | string;

  /**
   * The column header renderer. Should return any information you want to display in the column header
   * @param columnIndex The column index for the header cell
   * @returns Either a string or a JSX.Element to display in the header
   */
  onRenderColumnHeaderCell?: (columnIndex: number) => JSX.Element | string;

  /**
   * The row header renderer. Should return any information you want to display in the row header
   * @param rowIndex The row index for the header cell
   * @returns Either a string or a JSX.Element to display in the header
   */
  onRenderRowHeaderCell?: (rowIndex: number) => JSX.Element | string;

  /** The number of rows to render in the grid */
  numRows: number;

  /** The number of columns to render in the grid */
  numColumns: number;

  /** The height of the header row */
  headerRowHeight?: number;

  /** The height for each row */
  rowHeight?: number;

  /** The width of the row header */
  rowHeaderWidth?: number;

  /** The width for each column. This array should have a length equal to numColumns */
  columnWidths: number[];

  /** Accessor for the key of a column */
  getColumnKey?: (columnIndex: number) => string;

  /** Accessor for the key of a row */
  getRowKey?: (rowIndex: number) => string;

  /** Used to check if BaseGrid should totally recompute virtualization information and rerender */
  dirtyCanary: any;

  /** Defines the theme used for styling the cells and header */
  theme?: GridTheme;

  /*---------------
    |               |
    | FEATURE FLAGS |
    |               |
    ---------------*/
  /**
   * Handler to decide if a cell is editable
   * @param cellCoordinate The coordinate of the cell
   * @returns Is this cell editable?
   */
  isCellEditable?: (cellCoordinate: GridCoordinate) => boolean;

  /** Can you re-order columns @default false */
  isColumnDraggable?: boolean | ((columnIndex: number) => boolean);

  /** Can you click on a column header? */
  isColumnHeaderClickable?: boolean | ((columnIndex: number) => boolean);

  /** Can you re-size columns @default false */
  isColumnResizable?: boolean | ((columnIndex: number) => boolean);

  /** Can you select cells using drag? @default false */
  isColumnSelectable?: boolean | ((columnIndex: number) => boolean);

  /** Can you perform the fill operation? @default false */
  isFillEnabled?: boolean;

  /** Is the Grid header sticky? @default false */
  isHeaderSticky?: boolean;

  /** The selection mode of the grid */
  selectionMode?: SelectionMode;

  /** The current selection state of the grid */
  selectionState: SelectionState;

  /** Should the Grid cache rows during scrolling? */
  shouldCacheOnScroll?: boolean;

  /** Should the grid be virtualized? @default false */
  virtualized?: boolean;

  /** Is the grid a hierarchy grid */
  getIsColumnHierarchyCell?: (columnIndex: number) => boolean;

  /*-----------------
    |                 |
    | KEYBOARD EVENTS |
    |                 |
    -----------------*/

  /**
   * Handler for keyUp
   * @param event The associated Keyboard event
   */
  onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;

  /**
   * Handler for keyDown
   * @param event The associated Keyboard event
   */
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;

  /**
   * Handler for keyPress
   * @param event The associated Keyboard event
   */
  onKeyPress?: (event: React.KeyboardEvent<HTMLElement>) => void;

  /*--------------
    |              |
    | MOUSE EVENTS |
    |              |
    --------------*/

  /**
   * Called when a cell is clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a cell is right clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellRightClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a cell is double clicked
   * @param cellCoordinate The coordinate of the clicked cell
   * @param event The MouseEvent related to the click
   */
  onCellDoubleClick?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a mouse down is performed on a cell
   * @param cellCoordinate The coordinate of the cell
   * @param event The associated MouseEvent
   */
  onCellMouseDown?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a mouse enter is performed on a cell
   * @param cellCoordinate The coordinate of the cell
   * @param event The associated MouseEvent
   */
  onCellMouseEnter?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a mouse up is performed after a mouse down on a cell
   * @param event The associated MouseEvent
   */
  onCellMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when mouse down on the fill handle of the current selection
   * @param event The associated MouseEvent
   */
  onFillMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when mouse up is performed after a mouse down on the fill handle
   * @param cellCoordinate The coordinate of the cell
   * @param event The associated MouseEvent
   */
  onFillMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a cell is hovered over for a period of time
   * @param cellCoordinate The coordinate of the hovered cell
   * @param event The MouseEvent related to the hover
   */
  onCellTooltip?: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a column header is clicked
   * @param columnIndex The column index of the clicked header
   * @param event The MouseEvent related to the click
   */
  onColumnHeaderClick?: (columnIndex: number, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called when a column header is right clicked
   * @param columnIndex The column index of the clicked header
   * @param event The MouseEvent related to the click
   */
  onColumnHeaderRightClick?: (columnIndex: number, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called for rightclick event on a row header
   * @param rowIndex The index of the row
   * @param event The MouseEvent related to the click
   */
  onRowHeaderRightClick?: (rowIndex: number, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called for mousedown event on a row header
   * @param rowIndex The index of the row
   * @param event The MouseEvent related to the click
   */
  onRowHeaderMouseDown?: (rowIndex: number, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called for mouseenter event on a row header
   * @param rowIndex The index of the row
   * @param event The MouseEvent related to the click
   */
  onRowHeaderMouseEnter?: (rowIndex: number, event: React.MouseEvent<HTMLElement>) => void;

  /**
   * Called for mouseup event on a row header
   * @param event The MouseEvent related to the click
   */
  onRowHeaderMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;

  /*------------------
    |                  |
    | CLIPBOARD EVENTS |
    |                  |
    ------------------*/

  /**
   * On copy event handler
   * @param event The clipboard event, use to write data
   * @param selections The copied selections
   */
  onCopy?: (event: React.ClipboardEvent<HTMLElement>, selections: GridRegion[]) => void;

  /**
   * On cut event handler
   * @param event The clipboard event, use to write data
   * @param selections The cut selections
   */
  onCut?: (event: React.ClipboardEvent<HTMLElement>, selections: GridRegion[]) => void;

  /**
   * On paste event handler
   * @param event The clipboard event, use to read data
   * @param selections The pasted selections
   */
  onPaste?: (event: React.ClipboardEvent<HTMLElement>, selections: GridRegion[]) => void;

  /*---------------
    |               |
    | COLUMN EVENTS |
    |               |
    ---------------*/

  /**
   * Called when a column is re-ordered
   * @param previousIndex Where the column used to be
   * @param newIndex Where the column was dropped
   */
  onColumnReorder?: (previousIndex: number, newIndex: number) => void;

  /**
   * Called when a column is re-sized
   * @param columnIndex The re-sized column
   * @param size The new size
   */
  onColumnResize?: (columnIndex: number, size: number) => void;
}

export interface IBaseGridState {
  /** The currently dragged over column index. This column header will be painted specially */
  draggedOverColumnIndex: number;

  /** The current direction the column header is being dragged */
  dropDirection: DropDirection;

  /** First visible row. This index includes overscanned rows that may be offscren */
  visibleStart: number;

  /** Last visible row. This index includes overscanned rows that may be offscren */
  visibleEnd: number;

  /** Is the header in the fixed position? */
  isHeaderFixed: boolean;

  /** The width of the currently resizing column */
  resizingColumnWidth: number;

  /** The index of the currently resizing column */
  resizingColumnIndex: number;
}

/** Direction that the header cell will be dropped on */
export enum DropDirection {
  /** Not set */
  None,
  /** Left side in LTR mode, right side in RTL mode */
  TowardPrimarySide,
  /** Right side in LTR mode, left side in RTL mode */
  AwayPrimarySide
}

/** Column header class id */
const COLUMN_HEADER_ID: string = 'data-header-id';

/**
 * Foundation for all Grid like components. Provides and renders basic grid interactions
 * Includes support for:
 * - Rendering arbitrary data, including editors
 * - Clicking on all cells
 * - Resizable columns
 * - Reorderable columns
 * - Click and drag to select
 * - Click and pull to fill handle
 * - Sticky grid headers
 */
export class BaseGrid extends BaseComponent<IBaseGridProps, IBaseGridState> {
  /** The grid container component */
  public readonly gridContainerRef: HTMLElement;

  /** The header row component */
  public readonly headerRowRef: HeaderRow;

  /** The sticky header container component */
  public readonly stickyHeaderContainerRef: HeaderStickyContainer;

  /** A mapping between hidden cells and cells that span more than one row */
  private cellMapping: _.Dictionary<GridCoordinate>;

  /**
   * Was a column drag and drop event triggered by the BaseGrid?
   * We cannot access the drag data in onDragEnter, so we must use this flag
   */
  private hasColumnDragStarted: boolean;

  /**
   * What column is being dragged with a drag and drop event triggered by the BaseGrid?
   * We cannot access the drag data in onDragEnter, so we must use this flag
   */
  private dragSourceItem: HTMLElement;

  /** The nearest element that can scroll */
  private scrollableParent: HTMLElement;

  /** The range renderer to use  */
  private rangeRenderer: RangeRenderer;

  /** The row cache to use when scrolling to prevent excessive rendering */
  private rowCache: _.Dictionary<JSX.Element>;

  /** Manager which keeps track of the position of all rows */
  private rowPositionManager: IRowPositionManager;

  /** The start point of the column resize */
  private resizingColumnDragAnchor: number;

  /** The initial width of the currently resizing column */
  private resizingColumnInitialWidth: number;

  /** The previous recorded vertical scroll position */
  private previousScrollTopPosition: number;

  /** The recorded vertical scroll position */
  private scrollTopPosition: number;

  /** The recorded horizontal scroll position */
  private scrollLeftPosition: number;

  /** The height of the top spacer row */
  private topSpacerHeight: number;

  /** The height of the bottom spacer row */
  private bottomSpacerHeight: number;

  /** The id for the currently pending tooltip hover handler. Used to cancel if the mouse moves before the timeout occurs */
  private tooltipTimeoutId: number;

  /** The throttled key down handler */
  private throttledOnKeyDown = _.throttle(this.onKeyDown, GridConstants.KEY_DOWN_THROTTLE);

  /** The debounced scroll finish handler */
  private debouncedOnScrollFinish = _.debounce(this.onScrollFinished, GridConstants.SCROLL_FINISH_INTERVAL, {
    trailing: true,
    leading: false
  });

  /** The on scroll handler */
  private throttledOnScroll = _.throttle(this.onScroll, GridConstants.SCROLL_THROTTLE);

  /** The window resize handler */
  private windowResizeEventHandler: (event: UIEvent) => void = _.throttle(this.onResize, GridConstants.RESIZE_THROTTLE);

  /** Is the grid scrolling? */
  private isScrolling: boolean;

  /** The client rectangles of the scrollable parent */
  private scrollableParentClientRect: ClientRect;

  /** The client rectangle of the grid container */
  private gridContainerClientRect: ClientRect;

  /**
   * The vertical offset of the grid from the scrollable parent, without scrolling
   * This is used to account for some content inside the scrollable parent above the grid, in case of page scroll
   */
  private gridContainerInitialOffsetTopFromScrollableParent: number;

  /**
   * The horizontal offset of the grid from the scrollable parent, without scrolling
   * This is used to account for some content inside the scrollable parent before the grid
   */
  private gridContainerInitialOffsetLeftFromScrollableParent: number;

  /** The client width of the scrollable parent */
  private scrollableParentClientWidth: number;

  /** The client height of the scrollable parent */
  private scrollableParentClientHeight: number;

  /** The client width of the grid container */
  private gridContainerClientWidth: number;

  private stickyHeaderSupported: boolean;

  constructor(props: IBaseGridProps, context: any) {
    super(props, context);
    this.validateProps(props);

    const {
      numRows,
      rowHeight = GridDefaultProps.RowHeight,
      shouldCacheOnScroll = GridDefaultProps.ShouldCacheOnScroll,
      virtualized = GridDefaultProps.Virtualized
    } = this.props;
    this.cellMapping = {};
    this.hasColumnDragStarted = false;
    this.previousScrollTopPosition = 0;
    this.scrollTopPosition = 0;
    this.scrollLeftPosition = 0;
    this.topSpacerHeight = 0;
    this.bottomSpacerHeight = 0;
    this.rowCache = {};
    this.isScrolling = false;
    this.rowPositionManager = new FixedRowPositionManager(numRows, rowHeight);

    let initialStartRow: number = 0;
    let initialEndRow: number = Math.max(numRows - 1, 0);

    this.rangeRenderer = shouldCacheOnScroll ? RangeRenderers.cachedRenderer : RangeRenderers.defaultRenderer;

    // If virtualized, compute initially visible rows
    if (virtualized && numRows > 0) {
      let initialVisibilityInformation: VisibilityInformation = this.calculateVisibleRows();
      this.bottomSpacerHeight = initialVisibilityInformation.bottomHeight;
      this.topSpacerHeight = initialVisibilityInformation.topHeight;
      initialStartRow = initialVisibilityInformation.range.start;
      initialEndRow = initialVisibilityInformation.range.end;
    }

    this.state = {
      draggedOverColumnIndex: GridConstants.NOT_SET_INDEX,
      dropDirection: DropDirection.None,
      visibleStart: initialStartRow,
      visibleEnd: initialEndRow,
      isHeaderFixed: false,
      resizingColumnIndex: GridConstants.NOT_SET_INDEX,
      resizingColumnWidth: null
    };
  }

  public name(): string {
    return 'BaseGrid';
  }

  /**
   * Get the ref of the cell at the provided coordinate
   * @param cellCoordinate The coordinate
   */
  public getCellRef(cellCoordinate: GridCoordinate): HTMLDivElement {
    let row = this.refs[`${cellCoordinate.rowIndex}`] as Row;
    if (row) {
      let cell = row.getCellRef(cellCoordinate.columnIndex);
      if (cell) {
        return cell.container;
      }
    }
  }

  /*---------------------
    |                     |
    | RENDERING/LIFECYCLE |
    |                     |
    ---------------------*/

  protected renderComponent(): JSX.Element {
    const {
      gridAriaLabel,
      gridClassName,
      headerRowHeight = GridDefaultProps.HeaderRowHeight,
      numRows = 0,
      onRenderColumnHeaderCell,
      rowHeight = GridDefaultProps.RowHeight,
      theme = GridDefaultProps.Theme,
      gridAriaRoleAndAriaAttributes,
      selectionMode
    } = this.props;

    const { visibleStart, visibleEnd } = this.state;

    const gridStyle: React.CSSProperties = {
      height: rowHeight * (visibleEnd - visibleStart + 1),
      top: this.topSpacerHeight + (onRenderColumnHeaderCell ? headerRowHeight : 0),
      borderColor: theme.borderColor
    };

    return (
      <div
        className={css('grid-container', gridClassName)}
        ref={this.resolveRef(this, 'gridContainerRef')}
        onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
          event.persist();
          this.throttledOnKeyDown(event, event.currentTarget);
        }}
        onKeyUp={this.onKeyUp}
        onKeyPress={this.onKeyPress}
        onCopy={this.onCopy}
        onCut={this.onCut}
        onPaste={this.onPaste}
        tabIndex={0}
        aria-label={gridAriaLabel}
        aria-activedescendant={this.getPrimaryCellId()}
        aria-rowcount={numRows}
        aria-multiselectable={selectionMode !== SelectionMode.None && selectionMode !== SelectionMode.SingleCell}
        {...getNativeProps(gridAriaRoleAndAriaAttributes, [GridConstants.ROLE])}
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor
        }}
      >
        {/* Render the virtual container at the desired scroll height */}
        <div
          className={'grid-virtualized-container'}
          style={{ height: rowHeight * numRows + (onRenderColumnHeaderCell ? headerRowHeight : 0) }}
        >
          {/* If the header rendered was provided, render the header */}
          {onRenderColumnHeaderCell && this.renderHeader()}

          <div className={css('grid', { scrolling: this.isScrolling })} style={gridStyle}>
            {this.renderBody()}
          </div>
        </div>
      </div>
    );
  }

  /**
   * When we receive new props, we must update the visibility state as things might have changed
   */
  public componentWillReceiveProps(nextProps: IBaseGridProps): void {
    const {
      dirtyCanary,
      numRows,
      rowHeight = GridDefaultProps.RowHeight,
      virtualized = GridDefaultProps.Virtualized
    } = nextProps;

    this.validateProps(nextProps);
    this.rowPositionManager.setConfiguration(numRows, rowHeight);

    // Discard the cell mapping
    this.cellMapping = {};

    // If the canary is different, the scrollable parent might have updated, so update the layout properties
    if (this.props.dirtyCanary !== dirtyCanary) {
      this.updateClosestScrollableAncestor();
      this.updateScrollableParentLayoutProperties();
    }

    if (numRows > 0 && virtualized) {
      // Recalculate the visible rows
      this.setVisibilityState(this.calculateVisibleRows(nextProps));
    } else {
      // Set visible rows to all
      this.setVisibilityState({
        bottomHeight: 0,
        range: {
          start: 0,
          end: Math.max(numRows - 1, 0)
        },
        topHeight: 0
      });
    }
  }

  /**
   * When the component mounts, we attach handlers and update the closest scrollable ancestor
   */
  public componentDidMount(): void {
    this.events.on(window, 'resize', this.windowResizeEventHandler);
    this.updateClosestScrollableAncestor();
    this.updateScrollableParentLayoutProperties();
    this.updateGridLayoutProperties();
  }

  /**
   * After the component updates, we must update the closest scrollable ancestor if it has changed.
   */
  public componentDidUpdate(prevProps: IBaseGridProps, prevState: IBaseGridState): void {
    let {
      dirtyCanary,
      isHeaderSticky = GridDefaultProps.StickyHeaderEnabled,
      virtualized = GridDefaultProps.Virtualized
    } = this.props;

    // Perform a full re-render after the component updates to take into account new container widths and heights
    if (prevProps.dirtyCanary !== dirtyCanary) {
      // if the update was caused due to the parent getting updated, it may update the grid layout, so update the properties
      this.updateGridLayoutProperties();

      if (isHeaderSticky) {
        this.updateHeaderStickyStateIfNeeded();
      }

      if (virtualized) {
        this.setVisibilityState(this.calculateVisibleRows(this.props));
      }
    }

    if (this.props.selectionState) {
      // if primary cell changed and not visible, scroll to it
      let previousPrimaryCell: GridCoordinate = prevProps.selectionState && prevProps.selectionState.primaryCell;
      let newPrimaryCell: GridCoordinate = this.props.selectionState.primaryCell;
      if (
        newPrimaryCell &&
        !newPrimaryCell.equals(previousPrimaryCell) &&
        newPrimaryCell.rowIndex !== GridConstants.HEADER_ROW_INDEX
      ) {
        this.scrollToPrimaryCellIfNeeded(this.gridContainerRef);
      }

      // If switching from Edit to Select mode, set the focus back to the grid
      if (
        this.props.selectionState.mode === GridMode.Select &&
        prevProps.selectionState &&
        prevProps.selectionState.mode === GridMode.Edit
      ) {
        this.focusWithoutScrolling(this.gridContainerRef);
      }
    }
  }

  /**
   * Render the header cells. Calls onRenderHeaderCell numColumns times
   * If onRenderHeaderCell is not provided, this method will not be called
   * If column resize is enabled, we will also render the drag handler
   */
  private renderHeader(): JSX.Element {
    const {
      headerClassName,
      dirtyCanary,
      columnHeaderCellClassName,
      isColumnDraggable = GridDefaultProps.DragEnabled,
      isColumnHeaderClickable = GridDefaultProps.ColumnHeaderClickable,
      isColumnResizable = GridDefaultProps.ResizeEnabled,
      isHeaderSticky = GridDefaultProps.StickyHeaderEnabled,
      headerRowHeight = GridDefaultProps.HeaderRowHeight,
      rowHeaderWidth = GridDefaultProps.RowHeaderWidth,
      numColumns = 0,
      onColumnHeaderClick,
      onColumnHeaderRightClick,
      onRenderColumnHeaderCell,
      onRenderRowHeaderCell,
      selectionState,
      theme = GridDefaultProps.Theme
    } = this.props;

    const { isHeaderFixed } = this.state;

    let headerCells: JSX.Element[] = [];

    if (onRenderRowHeaderCell) {
      const id = 'header-row-header';

      headerCells.push(
        <RowHeaderCell
          id={id}
          key={id}
          isRowActive={false}
          width={rowHeaderWidth}
          height={headerRowHeight}
          theme={theme}
        />
      );
    }

    // setting all the columns with selected headers as active
    let activeColumns: _.Dictionary<boolean> = {};
    _.forEach(selectionState.selections, (selection: GridRegion) => {
      if (selection.primaryCoordinate.isColumnHeaderCell) {
        for (let index: number = selection.columnRange.start; index <= selection.columnRange.end; index++) {
          activeColumns[index] = true;
        }
      }
    });

    for (let columnIndex: number = 0; columnIndex < numColumns; columnIndex++) {
      let headerWidth = this.getColumnWidth(columnIndex);
      let key: string = 'ColumnHeaderCell_' + this.getColumnKey(columnIndex);
      const cellCoordinate: GridCoordinate = new GridCoordinate(GridConstants.HEADER_ROW_INDEX, columnIndex, true);

      headerCells.push(
        <ColumnHeaderCell
          id={key}
          key={key}
          className={PropUtils.getValueFromAccessor(columnHeaderCellClassName, columnIndex)}
          columnIndex={columnIndex}
          draggedOver={this.draggedOver(columnIndex)}
          isDragEnabled={PropUtils.getValueFromAccessorWithDefault(
            GridDefaultProps.DragEnabled,
            isColumnDraggable,
            columnIndex
          )}
          isColumnActive={activeColumns[columnIndex]}
          isSelected={cellCoordinate.equals(selectionState.primaryCell)}
          isResizeEnabled={PropUtils.getValueFromAccessorWithDefault(
            GridDefaultProps.ResizeEnabled,
            isColumnResizable,
            columnIndex
          )}
          onClick={PropUtils.getValueFromAccessor(isColumnHeaderClickable, columnIndex) && onColumnHeaderClick}
          onRightClick={
            PropUtils.getValueFromAccessor(isColumnHeaderClickable, columnIndex) && onColumnHeaderRightClick
          }
          onDragStart={this.onColumnDragStart}
          onDragFinish={this.onColumnDragFinish}
          onDragEnter={this.onColumnDragEnter}
          onDragOver={this.onColumnDragOver}
          onDragLeave={this.onColumnDragLeave}
          onMouseDown={this.onCellMouseDown}
          onDrop={this.onColumnDrop}
          onResizeHandleMouseDown={this.onColumnResizeMouseDown}
          theme={theme}
          width={headerWidth}
        >
          {onRenderColumnHeaderCell(columnIndex)}
        </ColumnHeaderCell>
      );
    }

    let headerRow: JSX.Element = (
      <HeaderRow
        ref={this.resolveRef(this, 'headerRowRef')}
        key="header-row"
        height={headerRowHeight}
        theme={theme}
        isHeaderFixed={isHeaderFixed}
        dirtyCanary={dirtyCanary}
      >
        {headerCells}
      </HeaderRow>
    );

    if (this.useCustomStickyHeader) {
      const leftOffset: number = this.getRTLSafeStickyHeaderLeftOffset();

      return (
        <HeaderStickyContainer
          ref={this.resolveRef(this, 'stickyHeaderContainerRef')}
          isFixed={isHeaderFixed}
          className={headerClassName}
          dirtyCanary={dirtyCanary}
          height={headerRowHeight}
          leftOffset={leftOffset}
          scrollableViewLeft={this.getRTLSafeScrollViewLeft()}
          scrollableViewTop={this.scrollableParentClientRect ? this.scrollableParentClientRect.top : 0}
          scrollableViewWidth={this.getStickyContainerWidth()}
          theme={theme}
          width={this.headerRowRef ? this.headerRowRef.width : undefined}
        >
          {headerRow}
        </HeaderStickyContainer>
      );
    } else {
      return (
        <HeaderContainer
          role={this.getHeaderRole()}
          isSticky={isHeaderSticky}
          className={headerClassName}
          height={headerRowHeight}
        >
          {headerRow}
        </HeaderContainer>
      );
    }
  }

  /**
   * Render the grid body
   */
  private renderBody(): JSX.Element {
    const { selectionState, theme = GridDefaultProps.Theme } = this.props;

    const { visibleStart, visibleEnd } = this.state;

    // setting all the rows with selected headers as active
    let activeRows: _.Dictionary<boolean> = {};
    _.forEach(selectionState.selections, (selection: GridRegion) => {
      if (selection.primaryCoordinate.isRowHeaderCell) {
        for (let index: number = selection.rowRange.start; index <= selection.rowRange.end; index++) {
          activeRows[index] = true;
        }
      }
    });

    const selectedRowIndexes: _.Dictionary<boolean> = this.getSelectedRowIndexes();

    let gridRows: JSX.Element[] = this.rangeRenderer({
      startIndex: visibleStart,
      endIndex: visibleEnd,
      cache: this.rowCache,
      isScrolling: this.isScrolling,
      getKey: (rowIndex: number) => this.getRowKey(rowIndex),
      render: (rowIndex: number) => this.renderRow(activeRows, rowIndex, selectedRowIndexes)
    });

    // If there is a row being edited outside the visible range, render it (outside the view) so the editor does not unmount
    if (
      selectionState.mode === GridMode.Edit &&
      (selectionState.primaryCell.rowIndex < visibleStart || selectionState.primaryCell.rowIndex > visibleEnd)
    ) {
      gridRows.push(this.renderRow(activeRows, selectionState.primaryCell.rowIndex, selectedRowIndexes, true));
    }

    const gridBodyStyle: React.CSSProperties = {
      borderColor: theme.borderColor
    };

    return (
      <div role={this.getHeaderRole()} className="grid-body" style={gridBodyStyle}>
        {gridRows}
      </div>
    );
  }

  /**
   * Render a grid row at index rowIndex
   * @param activeRows The dictionary containing the active rows
   * @param rowIndex The row index to render
   * @param top An optional value to position the row at in pixels
   */
  private renderRow(
    activeRows: _.Dictionary<boolean>,
    rowIndex: number,
    selectedRowIndexes: _.Dictionary<boolean>,
    fixedOffScreen: boolean = false
  ): JSX.Element {
    const {
      cellAriaAndDataAttributes,
      cellClassName,
      dirtyCanary,
      isFillEnabled = GridDefaultProps.FillEnabled,
      numColumns,
      onCellClick,
      onCellDoubleClick,
      onCellRightClick,
      onRenderCell,
      onRenderRowHeaderCell,
      rowAriaAndDataAttributes,
      rowClassName,
      rowHeight = GridDefaultProps.RowHeight,
      rowHeaderWidth = GridDefaultProps.RowHeaderWidth,
      selectionState,
      isCellEditable,
      theme = GridDefaultProps.Theme
    } = this.props;

    const { resizingColumnIndex, visibleStart, visibleEnd } = this.state;

    const resolvedRowKey: string = 'row_' + this.getRowKey(rowIndex);

    return (
      <Row
        ref={`${rowIndex}`}
        key={resolvedRowKey}
        ariaAndDataAttributes={PropUtils.getValueFromAccessor(rowAriaAndDataAttributes, rowIndex)}
        cellAriaAndDataAttributes={cellAriaAndDataAttributes}
        cellClassName={cellClassName}
        getCellIdentifier={this.getCellIdentifier}
        dirtyCanary={dirtyCanary}
        getCellRowSpan={this.getCellRowSpan}
        getCellWidth={this.getColumnWidth}
        getCellRole={this.getCellRole}
        isCellSelectable={this.isCellSelectable}
        isCellEditable={isCellEditable}
        isColumnResizing={resizingColumnIndex !== GridConstants.NOT_SET_INDEX}
        isFillEnabled={isFillEnabled}
        isRowActive={activeRows[rowIndex]}
        isRowWithinSelection={selectedRowIndexes && selectedRowIndexes[rowIndex]}
        numColumns={numColumns}
        onCellClick={onCellClick}
        onCellDoubleClick={onCellDoubleClick}
        onCellRightClick={onCellRightClick}
        onFillMouseDown={this.onFillMouseDown}
        onCellMouseDown={this.onCellMouseDown}
        onCellMouseEnter={this.onCellMouseEnter}
        onRenderCell={onRenderCell}
        onRenderRowHeaderCell={onRenderRowHeaderCell}
        onRowHeaderMouseDown={(event: React.MouseEvent<HTMLElement>) => this.onRowHeaderMouseDown(rowIndex, event)}
        onRowHeaderMouseEnter={(event: React.MouseEvent<HTMLElement>) => this.onRowHeaderMouseEnter(rowIndex, event)}
        onRowHeaderRightClick={(event: React.MouseEvent<HTMLElement>) => this.onRowHeaderRightClick(rowIndex, event)}
        rowHeaderWidth={rowHeaderWidth}
        rowHeight={rowHeight}
        selectionState={selectionState}
        theme={theme}
        className={PropUtils.getValueFromAccessor(rowClassName, rowIndex)}
        fixedOffScreen={fixedOffScreen}
        rowIndex={rowIndex}
        isGridScrolling={this.isScrolling}
        visibleRowStart={visibleStart}
        visibleRowEnd={visibleEnd}
      />
    );
  }

  /*----------------
    |                |
    | VIRTUALIZATION |
    |                |
    ----------------*/

  /**
   * Compute the information to determine the number of rows to display and set the state of the component
   * @param props The props to base the calculation off of. @default The current props
   */
  private calculateVisibleRows(props: IBaseGridProps = this.props): VisibilityInformation {
    // Compute visible rows if scroll position has changed
    let height: number = window.innerHeight;
    let scrollPositionWithinGrid: number = 0;
    if (
      this.scrollableParent &&
      this.gridContainerRef &&
      this.gridContainerInitialOffsetTopFromScrollableParent != null
    ) {
      height = this.scrollableParentClientHeight;
      scrollPositionWithinGrid = Math.max(
        this.scrollTopPosition - this.gridContainerInitialOffsetTopFromScrollableParent,
        0
      );
    }

    let topOverscan: number = GridConstants.DEFAULT_OVERSCAN;
    let bottomOverscan: number = GridConstants.DEFAULT_OVERSCAN;

    let visibilityInformation: VisibilityInformation = this.rowPositionManager.getVisibilityInformation(
      height,
      scrollPositionWithinGrid,
      topOverscan,
      bottomOverscan
    );
    return visibilityInformation;
  }

  /**
   * Set the visibility state for the grid.
   * @param visibilityInformation The row visibility information
   */
  private setVisibilityState(visibilityInformation: VisibilityInformation): void {
    const { visibleStart, visibleEnd } = this.state;

    this.topSpacerHeight = visibilityInformation.topHeight;
    this.bottomSpacerHeight = visibilityInformation.bottomHeight;

    // If the view indicies have changed, update the state
    if (visibleStart !== visibilityInformation.range.start || visibleEnd !== visibilityInformation.range.end) {
      this.setState((prevState: IBaseGridState) => {
        prevState.visibleStart = visibilityInformation.range.start;
        prevState.visibleEnd = visibilityInformation.range.end;
        return prevState;
      });
    }
  }

  /**
   * Updates the visible rows after a scroll event
   * You should use the throttled version of this function defined above
   */
  private updateVisibilityStateOnScroll(): void {
    this.setVisibilityState(this.calculateVisibleRows());
  }

  /**
   * Compare the current horizontal position of fixed sticky element with respect to the scroll view's position
   */
  private shouldStickyElementReRender() {
    let placeHolderElementClientRect = this.stickyHeaderContainerRef.placeHolderRect;
    let placeHolderLeftOffset = !getRTL()
      ? this.scrollableParentClientRect.left - placeHolderElementClientRect.left
      : placeHolderElementClientRect.right - this.scrollableParentClientRect.right;

    let stickyElementLeftOffset = this.scrollLeftPosition - this.gridContainerInitialOffsetLeftFromScrollableParent;
    // the sticky element should be horizontally aligned to the placeholder element
    return Math.abs(stickyElementLeftOffset - placeHolderLeftOffset) > 1;
  }

  /**
   * Iterates through the parent chain of the container to determine an element which is vertically scrollable
   * and adds the corresponding event listener
   */
  private updateClosestScrollableAncestor(): void {
    if (this.gridContainerRef) {
      let parent: HTMLElement = this.gridContainerRef;
      while (parent != null) {
        if (parent.scrollHeight > parent.clientHeight) {
          if (this.scrollableParent !== parent) {
            this.removeScrollEventHandler();
            this.scrollableParent = parent;
            this.addScrollEventHandler();
          }
          break;
        }

        parent = parent.parentElement;
      }
    }
  }

  /**
   * Updates the scrollable parent's layout properties
   */
  private updateScrollableParentLayoutProperties() {
    if (this.scrollableParent) {
      this.scrollableParentClientRect = this.scrollableParent.getBoundingClientRect();
      this.scrollableParentClientWidth = this.scrollableParent.clientWidth;
      this.scrollableParentClientHeight = this.scrollableParent.clientHeight;
      this.scrollTopPosition = this.scrollableParent.scrollTop;
      this.scrollLeftPosition = RtlUtils.getStandardizedScrollLeftValue(this.scrollableParent);
    }
  }

  /**
   * Updates the grid's layout properties
   */
  private updateGridLayoutProperties() {
    if (this.gridContainerRef) {
      this.gridContainerClientRect = this.gridContainerRef.getBoundingClientRect();
      this.gridContainerClientWidth = this.gridContainerRef.clientWidth;
    }

    if (this.scrollableParent) {
      // get the initial offset based on the current top and scrollTop positions
      this.gridContainerInitialOffsetTopFromScrollableParent =
        this.gridContainerClientRect.top - this.scrollableParentClientRect.top + this.scrollTopPosition;

      // get the initial offset based on the current left and scrollLeft positions
      this.gridContainerInitialOffsetLeftFromScrollableParent = !getRTL()
        ? this.gridContainerClientRect.left - this.scrollableParentClientRect.left + this.scrollLeftPosition
        : this.scrollableParentClientRect.right - this.gridContainerClientRect.right + this.scrollLeftPosition;
    }
  }

  /**
   * The event handler that gets called after the component mounts, component gets updated, if the component gets scrolled, or the window resizes
   * It determines the correct state of the component based on the positions of placeholder and scrollable parent and updates the state if needed
   */
  private updateHeaderStickyStateIfNeeded() {
    if (!this.useCustomStickyHeader) {
      return;
    }

    const { isHeaderFixed } = this.state;

    if (!this.gridContainerRef || !this.stickyHeaderContainerRef) {
      // Something went wrong, we should always be able to find these refs
      console.error('StickyContainer: Could not find the required references, contents will not stick', null);
      return;
    }

    if (this.scrollableParent == null) {
      // Container is already fixed on the page. Nothing to be done here
      return;
    }

    if (!isHeaderFixed) {
      if (this.scrollTopPosition > this.gridContainerInitialOffsetTopFromScrollableParent) {
        this.setState((prevState: IBaseGridState) => {
          prevState.isHeaderFixed = true;
          return prevState;
        });
      }
    } else {
      // Container is in fixed state
      if (this.scrollTopPosition < this.gridContainerInitialOffsetTopFromScrollableParent) {
        // Placeholder will be scrolled below the top of scroll view
        this.setState((prevState: IBaseGridState) => {
          prevState.isHeaderFixed = false;
          return prevState;
        });
      } else if (this.shouldStickyElementReRender()) {
        // If scrollview's position has been updated while scrolling/resizing, call setState to re-render the sticky Element
        this.setState((prevState: IBaseGridState) => {
          return prevState;
        });
      }
    }
  }

  /**
   * Get the role for the given cell coordinates
   */
  @autobind
  private getCellRole(cellCoordinate: GridCoordinate): string {
    //Role of the cell
    const { getIsColumnHierarchyCell } = this.props;

    if (!!getIsColumnHierarchyCell && getIsColumnHierarchyCell(cellCoordinate.columnIndex)) {
      return GridConstants.TREEITEM_ROLE;
    } else {
      return GridConstants.GRIDCELL_ROLE;
    }
  }

  /**
   * Get the role for the header row
   */
  private getHeaderRole(): string {
    const { gridAriaRoleAndAriaAttributes } = this.props;

    if (
      gridAriaRoleAndAriaAttributes &&
      gridAriaRoleAndAriaAttributes[GridConstants.ROLE] === GridConstants.TREEGRID_ROLE
    ) {
      return GridConstants.GROUP_ROLE;
    } else {
      return GridConstants.ROWGROUP_ROLE;
    }
  }

  /*------------------------
    |                        |
    | SCROLL/RESIZE HANDLERS |
    |                        |
    ------------------------*/

  /**
   * Add a scroll handler to the scrollable element
   */
  private addScrollEventHandler(): void {
    const {
      isHeaderSticky = GridDefaultProps.StickyHeaderEnabled,
      virtualized = GridDefaultProps.Virtualized
    } = this.props;

    if (this.scrollableParent && (virtualized || isHeaderSticky)) {
      if (window.getComputedStyle(this.scrollableParent)['will-change'] === 'auto') {
        console.warn(
          `BaseGrid is virtualized but the scrollable parent does not specify a will-change CSS property.
                    Scrolling performance may be reduced.
                    For more information, see https://developer.mozilla.org/en-US/docs/Web/CSS/will-change`
        );
      }

      this.events.on(this.scrollableParent, 'scroll', this.throttledOnScroll);
    }
  }

  /**
   * Remove the scroll handler from the scrollable element
   */
  private removeScrollEventHandler(): void {
    if (this.scrollableParent) {
      this.events.off(this.scrollableParent, 'scroll', this.throttledOnScroll);
    }
  }

  /**
   * On resize callback, recomputes the scrollable parent and the visible rows
   */
  private onResize(event: Event): void {
    const {
      isHeaderSticky = GridDefaultProps.StickyHeaderEnabled,
      virtualized = GridDefaultProps.Virtualized
    } = this.props;

    this.updateClosestScrollableAncestor();
    if (virtualized) {
      this.setVisibilityState(this.calculateVisibleRows());
    }

    if (isHeaderSticky) {
      this.updateHeaderStickyStateIfNeeded();
    }
  }

  /**
   * On scroll callback, recomputes visible rows
   */
  private onScroll(): void {
    const {
      isHeaderSticky = GridDefaultProps.StickyHeaderEnabled,
      virtualized = GridDefaultProps.Virtualized,
      rowHeight = GridDefaultProps.RowHeight
    } = this.props;

    this.scrollLeftPosition = RtlUtils.getStandardizedScrollLeftValue(this.scrollableParent);
    this.scrollTopPosition = this.scrollableParent.scrollTop;

    if (
      Math.abs(this.scrollTopPosition - this.previousScrollTopPosition) >
      GridConstants.UPDATE_VISIBLE_ROWS_THRESHOLD * rowHeight
    ) {
      this.previousScrollTopPosition = this.scrollTopPosition;

      // Invalidate row cache when scrolling starts
      if (!this.isScrolling) {
        this.rowCache = {};
        this.forceUpdate();
      }

      this.isScrolling = true;

      if (virtualized) {
        this.updateVisibilityStateOnScroll();
      }

      // Call onScrollFinished and set scrolling state
      this.debouncedOnScrollFinish();
    }

    if (isHeaderSticky) {
      this.updateHeaderStickyStateIfNeeded();
    }
  }

  /**
   * Called when scrolling completes
   * Sets isScrolling to false and forces re-render
   */
  private onScrollFinished(): void {
    this.isScrolling = false;
    // force update to re-render without the isScrolling flag
    this.forceUpdate();
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
  private onCellMouseDown(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { onCellMouseDown } = this.props;

    this.events.on(window, 'mouseup', this.onCellMouseUp);
    if (onCellMouseDown) {
      onCellMouseDown(cellCoordinate, event);
    }
  }
  /**
   * Handler for the mouseenter event on any cell
   * @param cellCoordinate The cell that fired the event
   */
  @autobind
  private onCellMouseEnter(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { selectionState, onCellMouseEnter } = this.props;

    if (onCellMouseEnter) {
      onCellMouseEnter(cellCoordinate, event);
    }

    // Fire a tooltip event if necessary
    if (selectionState.mode === GridMode.Select || selectionState.mode === GridMode.None) {
      if (this.tooltipTimeoutId !== null) {
        this.async.clearTimeout(this.tooltipTimeoutId);
        this.tooltipTimeoutId = null;
      }

      this.tooltipTimeoutId = this.async.setTimeout(() => {
        this.onCellTooltip(cellCoordinate, event);
      }, GridConstants.CELL_TOOLTIP_INTERVAL);
    }
  }

  /**
   * Handler for the mouseup event. Fired when the mouseup event occurs after a cell mousedown event
   * Removes the mouseup event from the window
   */
  private onCellMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { onCellMouseUp } = this.props;

    this.events.off(window, 'mouseup', this.onCellMouseUp);
    if (onCellMouseUp) {
      onCellMouseUp(event);
    }
  }

  /**
   * Called when a cell has been hovered over for CELL_TOOLTIP_INTERVAL ms
   * @param cellCoordinate The cell that fired the event
   */
  private onCellTooltip(cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>): void {
    const { onCellTooltip } = this.props;

    if (onCellTooltip) {
      onCellTooltip(cellCoordinate, event);
    }
  }

  /**
   * Handler for the mousedown event on the fill handle
   * Adds a mouseup handler to the window
   */
  @autobind
  private onFillMouseDown(event: React.MouseEvent<HTMLElement>): void {
    const { onFillMouseDown } = this.props;

    event.stopPropagation();
    this.events.on(window, 'mouseup', this.onFillMouseUp);
    if (onFillMouseDown) {
      onFillMouseDown(event);
    }
  }

  /**
   * Handler for the mouseup event after a fill operation
   * Removes the mouseup event from the window
   */
  @autobind
  private onFillMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { onFillMouseUp } = this.props;

    this.events.off(window, 'mouseup', this.onFillMouseUp);
    if (onFillMouseUp) {
      onFillMouseUp(event);
    }
  }

  /**
   * Handler for the mouse down event on a column resize handler
   * Saves the position of the handler, the width of the column, and the current column
   * Adds the mouseup and mousemove events to the window to listen for the drag
   * @param colIndex The column that is being resized
   * @param event The mouse down event
   */
  @autobind
  private onColumnResizeMouseDown(colIndex: number, event: React.MouseEvent<HTMLElement>) {
    const { resizingColumnIndex, resizingColumnWidth } = this.state;

    event.preventDefault();

    let resizingColumnCurrentWidth: number = this.getColumnWidth(colIndex);

    if (resizingColumnIndex !== colIndex || resizingColumnWidth !== resizingColumnCurrentWidth) {
      this.setState((prevState: IBaseGridState) => {
        prevState.resizingColumnIndex = colIndex;
        prevState.resizingColumnWidth = resizingColumnCurrentWidth;
        return prevState;
      });

      this.resizingColumnDragAnchor = event.clientX;
      this.resizingColumnInitialWidth = resizingColumnCurrentWidth;

      this.events.on(window, 'mousemove', this.onColumnResizeMove);
      this.events.on(window, 'mouseup', this.onColumnResizeMouseUp);
    }
  }

  /**
   * Handler for the mousemove event after a column resize mouse down
   * Computes the distance between the mouse down point and the current point and adds it
   * to the width of the resizing column
   * @param event The mouse move event
   */
  @autobind
  private onColumnResizeMove(event: React.MouseEvent<HTMLElement>) {
    const { resizingColumnWidth } = this.state;

    let newWidth = this.getNewWidth(this.resizingColumnInitialWidth, this.resizingColumnDragAnchor, event.clientX);

    if (newWidth !== resizingColumnWidth) {
      this.setState((prevState: IBaseGridState) => {
        prevState.resizingColumnWidth = newWidth;
        return prevState;
      });
    }
  }

  /**
   * Ends the resize operation and resets all the relevant values
   * @param event The mouse up event
   */
  @autobind
  private onColumnResizeMouseUp(event: React.MouseEvent<HTMLElement>) {
    const { onColumnResize } = this.props;

    const { resizingColumnIndex } = this.state;

    this.events.off(window, 'mouseup', this.onColumnResizeMouseUp);
    this.events.off(window, 'mousemove', this.onColumnResizeMove);

    let newWidth = this.getNewWidth(this.resizingColumnInitialWidth, this.resizingColumnDragAnchor, event.clientX);

    // call the resize handler
    if (onColumnResize) {
      onColumnResize(resizingColumnIndex, newWidth);
    }

    // reset the column width and index in the state
    this.setState((prevState: IBaseGridState) => {
      prevState.resizingColumnWidth = null;
      prevState.resizingColumnIndex = GridConstants.NOT_SET_INDEX;
      return prevState;
    });

    this.resizingColumnDragAnchor = GridConstants.NOT_SET_INDEX;
    this.resizingColumnInitialWidth = GridConstants.NOT_SET_INDEX;
  }

  /**
   * Handler for the mousedown event on row header
   * @param rowIndex The index of the row
   */
  private onRowHeaderMouseDown(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { onRowHeaderMouseDown } = this.props;

    this.events.on(window, 'mouseup', this.onRowHeaderMouseUp);
    if (onRowHeaderMouseDown) {
      onRowHeaderMouseDown(rowIndex, event);
    }
  }

  /**
   * Handler for the mouseenter event on row header
   * @param rowIndex The index of the row
   */
  private onRowHeaderMouseEnter(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { onRowHeaderMouseEnter } = this.props;

    if (onRowHeaderMouseEnter) {
      onRowHeaderMouseEnter(rowIndex, event);
    }
  }

  /**
   * Handler for the rightclick / contextmenu event on row header
   * @param rowIndex The index of the row
   * @param event event that started this handler
   */
  @autobind
  private onRowHeaderRightClick(rowIndex: number, event: React.MouseEvent<HTMLElement>): void {
    const { onRowHeaderRightClick } = this.props;

    if (onRowHeaderRightClick) {
      onRowHeaderRightClick(rowIndex, event);
    }
  }

  /**
   * Handler for the mouseup event on row header. Fired when the mouseup event occurs after row header mousedown event
   * Removes the mouseup event from the window
   */
  private onRowHeaderMouseUp(event: React.MouseEvent<HTMLElement>): void {
    const { onRowHeaderMouseUp } = this.props;

    this.events.off(window, 'mouseup', this.onRowHeaderMouseUp);
    if (onRowHeaderMouseUp) {
      onRowHeaderMouseUp(event);
    }
  }

  /*--------------------
    |                    |
    | CLIPBOARD HANDLERS |
    |                    |
    --------------------*/

  /**
   * Called when the copy event is fired
   */
  @autobind
  private onCopy(event: React.ClipboardEvent<HTMLElement>) {
    const { onCopy, selectionState } = this.props;

    if (selectionState.mode === GridMode.Select && onCopy) {
      onCopy(event, selectionState.selections);
    }
  }

  /**
   * Called when the cut event is fired
   */
  @autobind
  private onCut(event: React.ClipboardEvent<HTMLElement>) {
    const { onCut, selectionState } = this.props;

    if (selectionState.mode === GridMode.Select && onCut) {
      onCut(event, selectionState.selections);
    }
  }

  /**
   * Called when the paste event is fired
   */
  @autobind
  private onPaste(event: React.ClipboardEvent<HTMLElement>) {
    const { onPaste, selectionState } = this.props;

    if (selectionState.mode === GridMode.Select && onPaste) {
      onPaste(event, selectionState.selections);
    }
  }

  /*-------------------
    |                   |
    | KEYBOARD HANDLERS |
    |                   |
    -------------------*/

  /**
   * Capture the keyUp event, and call the delegate in the props if provided
   */
  @autobind
  private onKeyUp(event: React.KeyboardEvent<HTMLElement>) {
    const { onKeyUp } = this.props;

    if (onKeyUp) {
      onKeyUp(event);
    }
  }

  /**
   * Capture the keydown event, and call the delegate in the props if provided
   * @param currentTarget the event.currentTarget passed in case the currentTarget on the event is lost.
   */
  @autobind
  private onKeyDown(event: React.KeyboardEvent<HTMLElement>, currentTarget: HTMLElement) {
    const { onKeyDown } = this.props;

    // set currentTarget if it was lost
    if (!event.currentTarget) {
      event.currentTarget = currentTarget;
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  }

  /**
   * Capture the keypress event, and call the delegate in the props if provided
   */
  @autobind
  private onKeyPress(event: React.KeyboardEvent<HTMLElement>) {
    const { onKeyPress } = this.props;

    if (onKeyPress) {
      onKeyPress(event);
    }
  }

  /*------------------------
    |                        |
    | MISCELLANEOUS HANDLERS |
    |                        |
    ------------------------*/

  /**
   * Handler for when a column is dragged
   * @param event The React synthetic drag event
   */
  @autobind
  private onColumnDragStart(event: React.DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = 'move';
    let columnId: string = event.currentTarget.getAttribute(COLUMN_HEADER_ID);
    if (columnId) {
      event.dataTransfer.setData('text', columnId);
      this.hasColumnDragStarted = true;
      this.dragSourceItem = event.currentTarget;
    }
  }

  /**
   * Handler for when a column stops being dragged. Sets the current dragged over column to -1
   * @param event The React synthetic drag event
   */
  @autobind
  private onColumnDragFinish(event: React.DragEvent<HTMLElement>) {
    this.hasColumnDragStarted = false;
    this.setState((prevState: IBaseGridState) => {
      prevState.draggedOverColumnIndex = GridConstants.NOT_SET_INDEX;
      prevState.dropDirection = DropDirection.None;
      return prevState;
    });
  }

  /**
   * Handler for when a column is dropped
   * @param event The React synthetic drag event
   */
  @autobind
  private onColumnDrop(event: React.DragEvent<HTMLElement>) {
    const { isColumnDraggable, onColumnReorder } = this.props;

    event.preventDefault();
    if (this.hasColumnDragStarted && onColumnReorder) {
      let sourceId: string = event.dataTransfer.getData('text');
      let targetId = event.currentTarget.getAttribute(COLUMN_HEADER_ID);
      let currentDraggedOverColumnIndex = Number(targetId);

      if (
        PropUtils.getValueFromAccessorWithDefault(
          GridDefaultProps.DragEnabled,
          isColumnDraggable,
          currentDraggedOverColumnIndex
        )
      ) {
        if (sourceId && targetId) {
          let from: number = Number(sourceId);
          let to: number = Number(targetId);
          if (!isNaN(from) && !isNaN(to)) {
            if (from !== to) {
              let insertAfter: boolean = this.state.dropDirection === DropDirection.AwayPrimarySide;
              // Update to index to be the correct side (before or after)
              to =
                to > from
                  ? // going right
                    insertAfter
                    ? to
                    : to - 1
                  : // going left
                    insertAfter
                    ? to + 1
                    : to;
              // Check again after to is updated
              if (from !== to) {
                onColumnReorder(from, to);
              }
            }
          }
        }
      }
    }

    // Clear drag source
    this.dragSourceItem = null;
  }

  /**
   * Handler for when a column is hovered over another. Changes the style of the column header
   * @param event The React synthetic drag event
   */
  @autobind
  private onColumnDragEnter(event: React.DragEvent<HTMLElement>) {
    const { isColumnDraggable } = this.props;

    const { draggedOverColumnIndex } = this.state;

    event.preventDefault();
    if (this.hasColumnDragStarted) {
      let targetId = event.currentTarget.getAttribute(COLUMN_HEADER_ID);

      if (targetId) {
        let currentDraggedOverColumnIndex = Number(targetId);
        if (draggedOverColumnIndex !== currentDraggedOverColumnIndex) {
          this.setState((prevState: IBaseGridState) => {
            // Set current column to being dragged over unless it is not dragable then it is also not a drop target.
            prevState.draggedOverColumnIndex = PropUtils.getValueFromAccessorWithDefault(
              GridDefaultProps.DragEnabled,
              isColumnDraggable,
              currentDraggedOverColumnIndex
            )
              ? currentDraggedOverColumnIndex
              : GridConstants.NOT_SET_INDEX;
            return prevState;
          });
        }
      }
    }
  }

  /**
   * Handler for when a column is hovered over another
   * More functionality can be added here if desired, but event.preventDefault() is required
   * for the onDrop event to be fired.
   * See: http://stackoverflow.com/questions/8414154/html5-drop-event-doesnt-work-unless-dragover-is-handled
   */
  @autobind
  private onColumnDragOver(event: React.DragEvent<HTMLElement>) {
    const { draggedOverColumnIndex } = this.state;
    event.preventDefault();

    if (this.hasColumnDragStarted) {
      let otherColumn: HTMLElement = event.currentTarget as HTMLElement;
      let otherColumnXPosition = otherColumn.getBoundingClientRect().left;
      let otherColumnWidth = otherColumn.offsetWidth;
      let currentMouseX: number = event.clientX;
      let dropDirection: DropDirection = DropDirection.None;
      let dragPercentage = GridConstants.COLUMN_DRAG_THRESHOLD / 100;

      // Check dragging direction
      let draggingTowardLeftNav: boolean =
        Number(this.dragSourceItem.getAttribute(COLUMN_HEADER_ID)) > draggedOverColumnIndex;
      let draggingAwayPrimarySide: boolean =
        Number(this.dragSourceItem.getAttribute(COLUMN_HEADER_ID)) < draggedOverColumnIndex;
      let pastLeftColumnThreshold: boolean =
        currentMouseX < otherColumnXPosition + otherColumnWidth - dragPercentage * otherColumnWidth;
      let pastRightColumnThreshold: boolean = currentMouseX > otherColumnXPosition + dragPercentage * otherColumnWidth;

      if (draggingTowardLeftNav) {
        if (!getRTL()) {
          if (pastLeftColumnThreshold) {
            dropDirection = DropDirection.TowardPrimarySide;
          }
        } else {
          if (pastRightColumnThreshold) {
            dropDirection = DropDirection.TowardPrimarySide;
          }
        }
      } else if (draggingAwayPrimarySide) {
        if (!getRTL()) {
          if (pastRightColumnThreshold) {
            dropDirection = DropDirection.AwayPrimarySide;
          }
        } else {
          if (pastLeftColumnThreshold) {
            dropDirection = DropDirection.AwayPrimarySide;
          }
        }
      }

      if (this.state.dropDirection !== dropDirection) {
        this.setState((prevState: IBaseGridState) => {
          prevState.dropDirection = dropDirection;
          return prevState;
        });
      }
    }
  }

  /**
   * Handler for when a column stops hovering over another
   */
  @autobind
  private onColumnDragLeave(event: React.DragEvent<HTMLElement>) {
    const { draggedOverColumnIndex } = this.state;

    event.preventDefault();
    if (this.hasColumnDragStarted) {
      let targetId = event.currentTarget.getAttribute(COLUMN_HEADER_ID);

      if (Number(targetId) !== draggedOverColumnIndex) {
        let dropDirection: DropDirection = DropDirection.None;
        if (this.state.dropDirection !== dropDirection) {
          this.setState((prevState: IBaseGridState) => {
            prevState.dropDirection = dropDirection;
            return prevState;
          });
        }
      }
    }
  }

  /*---------
    |         |
    | HELPERS |
    |         |
    ---------*/

  /**
   * Show dragged over indicator if dragged column is not the same as drop column
   * @param columnIndex The column index for the header cell
   */
  private draggedOver(columnIndex: number): boolean {
    const { draggedOverColumnIndex, dropDirection } = this.state;

    return (
      // Dragged over column is this column and drop direction is near
      ((draggedOverColumnIndex === columnIndex && dropDirection === DropDirection.TowardPrimarySide) ||
        // Dragged over column is the previous column but drop direction is far
        (draggedOverColumnIndex === columnIndex - 1 && dropDirection === DropDirection.AwayPrimarySide)) &&
      // Source and target and not the same column
      this.dragSourceItem &&
      draggedOverColumnIndex !== Number(this.dragSourceItem.getAttribute(COLUMN_HEADER_ID)) &&
      // Column does not share a side with the column being dragged
      !this.dropDirectionAdjacent(dropDirection)
    );
  }

  /**
   * Returns drop direction filtering for adjacent drags
   */
  private dropDirectionAdjacent(dropDirection: DropDirection): boolean {
    const { draggedOverColumnIndex } = this.state;

    if (this.dragSourceItem) {
      let sourceId: string = this.dragSourceItem.getAttribute(COLUMN_HEADER_ID);
      if (sourceId) {
        let dragDiff: number = draggedOverColumnIndex - Number(sourceId);
        if (dragDiff === 1) {
          // Column is adjacent near side
          return dropDirection === DropDirection.TowardPrimarySide;
        } else if (dragDiff === -1) {
          // Column is adjacent far side
          return dropDirection === DropDirection.AwayPrimarySide;
        }
      }
    }

    return false;
  }

  /**
   * Set focus to this element without snapping to it
   * Saves the previous scroll position of the scrollable parent, calls focus on element, and resets the scroll position
   * @param element The element to focus
   */
  private focusWithoutScrolling(element: HTMLElement): void {
    if (element) {
      if (this.scrollableParent) {
        const scrollTop = this.scrollableParent.scrollTop;
        const scrollLeft = this.scrollableParent.scrollLeft;
        element.focus();
        this.scrollableParent.scrollTop = scrollTop;
        this.scrollableParent.scrollLeft = scrollLeft;
      } else {
        element.focus();
      }
    }
  }

  /**
   * Is the cell selectable, given the coordinate of the cell?
   * @param cellCoordinate The coordinate of the cell
   */
  @autobind
  private isCellSelectable(cellCoordinate: GridCoordinate): boolean {
    const {
      isColumnSelectable = GridDefaultProps.SelectionEnabled,
      selectionMode = GridDefaultProps.SelectionMode
    } = this.props;

    return (
      selectionMode !== SelectionMode.None &&
      PropUtils.getValueFromAccessorWithDefault(
        GridDefaultProps.SelectionEnabled,
        isColumnSelectable,
        cellCoordinate.columnIndex
      )
    );
  }

  /**
   * Returns the row span of a cell
   * @param cellCoordinate The coordinate of the cell
   */
  @autobind
  private getCellRowSpan(cellCoordinate: GridCoordinate): number {
    const cellIdentifier: string = this.getCellIdentifier(cellCoordinate);
    if (this.cellMapping[cellIdentifier]) {
      // If a cell is already mapped to another cell, return 0
      return 0;
    } else {
      // get the rowSpan from the consumer
      const cellRowSpan: number = this.getRowSpan(cellCoordinate);
      if (cellRowSpan > 1) {
        // add the spanned cells to the mapping
        for (let i = cellCoordinate.rowIndex + 1; i < cellCoordinate.rowIndex + cellRowSpan; i++) {
          const mappedCoordinate: GridCoordinate = new GridCoordinate(i, cellCoordinate.columnIndex);
          const mappedIdentifier: string = this.getCellIdentifier(mappedCoordinate);
          this.cellMapping[mappedIdentifier] = cellCoordinate;
        }
      }
      return cellRowSpan;
    }
  }

  /**
   * Get an identifier for a cell
   * @param cellCoordinate The cell to get the identifier for
   */
  @autobind
  private getCellIdentifier(cellCoordinate: GridCoordinate): string {
    if (cellCoordinate.isColumnHeaderCell) {
      return 'ColumnHeaderCell_' + this.getColumnKey(cellCoordinate.columnIndex);
    } else {
      return 'cell_' + this.getRowKey(cellCoordinate.rowIndex) + '_' + this.getColumnKey(cellCoordinate.columnIndex);
    }
  }

  /**
   * Get the key for a column
   * @param columnIndex The column to get a key for
   */
  private getColumnKey(columnIndex: number): string {
    const { getColumnKey } = this.props;

    return getColumnKey ? getColumnKey(columnIndex) : columnIndex.toString();
  }

  /**
   * Get the width of a column
   * @param colIndex The column index to get the width for
   */
  @autobind
  private getColumnWidth(colIndex: number): number {
    const { columnWidths } = this.props;

    const { resizingColumnIndex, resizingColumnWidth } = this.state;

    if (colIndex === resizingColumnIndex) {
      return Math.max(resizingColumnWidth, GridConstants.COLUMN_MIN_WIDTH_PIXELS);
    }

    return Math.max(columnWidths[colIndex], GridConstants.COLUMN_MIN_WIDTH_PIXELS);
  }

  /**
   * Returns the identifier for the current active cell
   */
  private getPrimaryCellId(): string {
    const { selectionState } = this.props;

    if (selectionState.primaryCell && selectionState.mode !== GridMode.None) {
      return this.getCellIdentifier(selectionState.primaryCell);
    }

    return null;
  }

  /**
   * Get a key for a row
   * @param The row index to get a key for
   */
  private getRowKey(rowIndex: number): string {
    const { getRowKey } = this.props;

    return getRowKey ? getRowKey(rowIndex) : rowIndex.toString();
  }

  /**
   * Get the row span for a cell
   * @param cellCoordinate Coordinate
   */
  @autobind
  private getRowSpan(cellCoordinate: GridCoordinate): number {
    const { getRowSpan } = this.props;

    const rowSpan: number = getRowSpan ? getRowSpan(cellCoordinate) : 1;
    if (rowSpan == null) {
      return 0;
    }

    if (rowSpan < 0) {
      throw new Error('Rowspan must be a value greater than or equal to 0. Value was ' + rowSpan);
    }
    return rowSpan;
  }

  /**
   * Gets the row indexes included in the selection
   */
  @autobind
  private getSelectedRowIndexes(): _.Dictionary<boolean> {
    let selections: GridRegion[] = this.props.selectionState.selections || [];
    let selectedRowIndexes: _.Dictionary<boolean> = {};
    _.forEach(selections, (selection: GridRegion) => {
      for (let index: number = selection.rowRange.start; index <= selection.rowRange.end; index++) {
        selectedRowIndexes[index] = true;
      }
    });
    return selectedRowIndexes;
  }

  /**
   * Sets the scroll top on the scrollable parent to make the row corresponding to primary cell visible, if not already
   * @param element The element to focus
   */
  private scrollToPrimaryCellIfNeeded(element: HTMLElement) {
    const { headerRowHeight = GridDefaultProps.HeaderRowHeight, selectionState } = this.props;

    const { isHeaderFixed } = this.state;

    if (selectionState.mode === GridMode.Select && this.scrollableParent && this.gridContainerRef) {
      // if header is fixed, it means the content above is already scrolled beyond the scrollable parent,
      // so this.scrollableParentClientRect.top + headerRowHeight is the visible top
      // if header is not fixed, then visible top may be below the scrollable parent's top, in case there is some content above the grid in page scroll scenario.
      // so computing the visible top using the initial offset and scrollTop position
      let gridVisibleTop: number = isHeaderFixed
        ? this.scrollableParentClientRect.top + headerRowHeight
        : Math.max(
            this.scrollableParentClientRect.top,
            this.scrollableParentClientRect.top +
              this.gridContainerInitialOffsetTopFromScrollableParent +
              headerRowHeight -
              this.scrollTopPosition
          );

      let gridVisibleBottom: number = Math.min(
        this.scrollableParentClientRect.bottom,
        this.gridContainerClientRect.bottom
      );

      let height: number = Math.max(gridVisibleBottom - gridVisibleTop, 0);
      height = Math.min(height, this.scrollableParentClientHeight); // In case the scrollable parent has a bottom scroll bar, the clientHeight is less than bottom-top

      let scrollPositionWithinGrid: number = Math.max(
        0,
        this.scrollTopPosition -
          (isHeaderFixed
            ? this.gridContainerInitialOffsetTopFromScrollableParent
            : this.gridContainerInitialOffsetTopFromScrollableParent + headerRowHeight)
      );
      let rowRange: RowRange = this.rowPositionManager.getFullyVisibleRowRange(height, scrollPositionWithinGrid);
      let rowBounds: RowBoundaries = this.rowPositionManager.getRowBounds(selectionState.primaryCell.rowIndex);
      let gridOffsetTop: number = this.gridContainerInitialOffsetTopFromScrollableParent;

      if (selectionState.primaryCell.rowIndex < rowRange.start) {
        // if the active element is above the visible rows
        this.scrollableParent.scrollTop =
          rowBounds.verticalOffset + gridOffsetTop + headerRowHeight - (isHeaderFixed ? headerRowHeight : 0);
      } else if (selectionState.primaryCell.rowIndex > rowRange.end) {
        // if the active element is below the visible rows
        // subtracting the height since we want to align the row to bottom, and adding a rowHeight since we want the row to be above the bottom boundary
        this.scrollableParent.scrollTop =
          rowBounds.verticalOffset +
          gridOffsetTop +
          headerRowHeight -
          this.scrollableParentClientHeight +
          rowBounds.height;
      }

      element.focus();
    }
  }

  /**
   * Gets a new width from an anchor, an initial width, and a drag delta. RTL safe
   * @param initialWidth The initial width
   * @param anchor The drag anchor
   * @param newX The new drag X value
   */
  private getNewWidth(initialWidth: number, anchor: number, newX: number): number {
    let xDiff = newX - anchor;
    if (getRTL()) {
      xDiff *= -1;
    }

    let newWidth = initialWidth + xDiff;

    // make sure to not go smaller than min-width
    newWidth = Math.max(GridConstants.COLUMN_MIN_WIDTH_PIXELS, newWidth);

    return newWidth;
  }

  /**
   * Returns the width to be set on the sticky container,
   * Returns undefined if grid container is null,
   * Returns width of the grid container if scrollable parent is null,
   * Returns the minimum of the grid container width, and scrollable parent width, if both present
   */
  private getStickyContainerWidth(): number {
    if (this.scrollableParentClientWidth && this.gridContainerClientWidth) {
      // if both exist, return the min
      return Math.min(this.scrollableParentClientWidth, this.gridContainerClientWidth);
    } else if (this.gridContainerClientWidth) {
      return this.gridContainerClientWidth;
    }
  }

  /**
   * Returns the left offset of the scroll view in LTR,
   * and the right offset in RTL
   */
  private getRTLSafeScrollViewLeft() {
    if (this.scrollableParentClientRect) {
      // scrollableParentClientRect.right is the position of the right edge of the component from the left edge of the browser,
      // so subtract it from window.innerWidth to get the position of the right edge of the component from the right edge of the browser
      return !getRTL()
        ? this.scrollableParentClientRect.left
        : window.innerWidth - this.scrollableParentClientRect.right;
    }

    return 0;
  }

  /**
   * Returns the left/right offset of the grid container from the scroll view respecting current rtl setting
   */
  private getRTLSafeStickyHeaderLeftOffset() {
    return this.gridContainerInitialOffsetLeftFromScrollableParent - this.scrollLeftPosition;
  }

  /**
   * Should we use the custom sticky header. Returns false if the browser supports position:sticky
   */
  private get useCustomStickyHeader(): boolean {
    if (this.stickyHeaderSupported === undefined) {
      // test for sticky header
      this.stickyHeaderSupported = CSSUtils.isPropertySupported('position', 'sticky');
    }

    return !this.stickyHeaderSupported;
  }

  /**
   * Validate the props for this component
   * @param props The props set to check
   */
  private validateProps(props: IBaseGridProps) {
    const { columnWidths, numColumns, onRenderCell } = props;

    if (!onRenderCell) {
      throw new PropValidationError('BaseGrid', 'onRenderCell', 'Property is required');
    }
    if (numColumns <= 0) {
      throw new PropValidationError('BaseGrid', 'numColumns', 'Value should be greater than 0');
    }
    if (columnWidths) {
      if (columnWidths.length !== numColumns) {
        throw new PropValidationError(
          'BaseGrid',
          'columnWidths',
          'You must provide an array with the widths for each column'
        );
      }
      if (!_.every(columnWidths, (width: number) => width != null && width >= 0)) {
        throw new PropValidationError('BaseGrid', 'columnWidths', 'No null values are allowed');
      }
    } else {
      throw new PropValidationError('BaseGrid', 'columnWidths', 'Column widths must not be null');
    }
  }
}
