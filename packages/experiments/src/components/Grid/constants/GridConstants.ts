import { GridThemes } from '../base/Themes';
import { SelectionMode as SelectionModeEnum, GridMode, GridCoordinate, GridTheme } from '../common/Common';
import { SelectionState } from '../managers/StateManager';

/**
 * The default props for Grid components
 */
export namespace GridDefaultProps {
    /** The default height for the header row */
    export const HeaderRowHeight: number = 40;

    /** The default height for the data rows */
    export const RowHeight: number = 50;

    /** The default width for the row header */
    export const RowHeaderWidth: number = 50;

    /** Default column header clickable */
    export const ColumnHeaderClickable: boolean = false;

    /** Default column drag and drop behavior */
    export const DragEnabled: boolean = false;

    /** Default column resize behavior */
    export const ResizeEnabled: boolean = false;

    /** Default cell fill behavior */
    export const FillEnabled: boolean = false;

    /** Default column header visibility */
    export const HideColumnHeader: boolean = false;

    /** Default theme to style the grid */
    export const Theme: GridTheme = GridThemes.NoBorder;

    /** Default sticky header behavior */
    export const StickyHeaderEnabled: boolean = false;

    /** Default selection behavior */
    export const SelectionEnabled: boolean = false;

    /** Default selection mode */
    export const SelectionMode: SelectionModeEnum = SelectionModeEnum.None;

    /** Default caching choice */
    export const ShouldCacheOnScroll: boolean = true;

    /** Default grid lines style */
    export const ShowGridLines: boolean = false;

    /** Default row header visibility */
    export const ShowRowHeader: boolean = false;

    /** Default show footer row */
    export const ShowFooterRow: boolean = false;

    /** Default virtualization behavior */
    export const Virtualized: boolean = false;
}

export namespace GridConstants {
    /** How long to mouse over a cell before calling onCellTooltip */
    export const CELL_TOOLTIP_INTERVAL = 500;

    /** Number (to be converted to a percentage) that designates a column drag is occurring */
    export const COLUMN_DRAG_THRESHOLD = 25;

    /** Minimum width of a resizable column, in pixels */
    export const COLUMN_MIN_WIDTH_PIXELS = 30;

    /** Number of extra rows to render in the scrolling direction */
    export const DEFAULT_OVERSCAN = 20;

    /** OnKeyDown interval. Throttled at 60fps */
    export const KEY_DOWN_THROTTLE = 17;

    /** Default index for uninitialized values */
    export const NOT_SET_INDEX = -1;

    /** Header row index */
    export const HEADER_ROW_INDEX = -1;

    /** Default selection state of the grid */
    export const DEFAULT_SELECTION_STATE: SelectionState = {
        fillSelection: null,
        mode: GridMode.None,
        selections: [],
        primaryCell: new GridCoordinate(GridConstants.NOT_SET_INDEX, GridConstants.NOT_SET_INDEX)
    };

    /** Window resize interval */
    export const RESIZE_THROTTLE = 150;

    /** How long to wait before calling the scroll finish event */
    export const SCROLL_FINISH_INTERVAL = 250;

    /** Number of rows to scroll before trying to update the visible rows */
    export const UPDATE_VISIBLE_ROWS_THRESHOLD = DEFAULT_OVERSCAN / 2;

    /** OnScroll interval. Throttled at 60fps */
    export const SCROLL_THROTTLE = KEY_DOWN_THROTTLE;

    /** How long to display a validation error */
    export const VALIDATION_CLEAR_DELAY = 3000;

    /** Key used for footer row */
    export const __FOOTER_ROW_KEY = '__FOOTER_ROW_KEY';

    /** Aria role name for treegrid */
    export const TREEGRID_ROLE = 'treegrid';

    /** Aria role name for grid */
    export const GRID_ROLE = 'grid';

    /** Aria role name for treeitem */
    export const TREEITEM_ROLE = 'treeitem';

    /** Aria role name for gridcell */
    export const GRIDCELL_ROLE = 'gridcell';

    /** Aria property name aria-readonly */
    export const ARIA_READONLY = 'aria-readonly';

    /** Aria role name for rowgroup */
    export const ROWGROUP_ROLE = 'rowgroup';

    /** Aria role name for group */
    export const GROUP_ROLE = 'group';

    /** Role name */
    export const ROLE = 'role';
}
