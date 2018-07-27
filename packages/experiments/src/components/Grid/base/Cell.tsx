/* tslint:disable:no-any */
/* tslint:disable:jsx-no-lambda */
/* tslint:disable:jsx-ban-props */
import * as React from 'react';
import * as _ from 'lodash';

import { BaseComponent } from '../utilities/BaseComponent';
import { css } from '@uifabric/utilities/lib-commonjs/css';
import { getNativeProps } from '@uifabric/utilities/lib-commonjs/properties';
import { GridCoordinate, CellRegionPosition, GridTheme } from '../common/Common';
import { RtlUtils } from '../utilities/RtlUtils';
import { PropUtils } from '../utilities/PropUtils';
import { GridConstants } from '../constants/GridConstants';

export interface ICellProps extends React.Props<Cell> {
  /** The aria and data attributes for this cell */
  ariaAndDataAttributes: _.Dictionary<string>;

  /** The class name for this cell */
  className: string;

  /** The coordinate where this cell is located */
  coordinate: GridCoordinate;

  /** Is the cell being edited? */
  editing: boolean;

  /** Position of the cell within the fill region. Null if there is no fill region or the cell is not within the region */
  fillPosition: CellRegionPosition;

  /** The height of the cell in pixels */
  height: number;

  /** The identifier of the cell, used for active descendant */
  id: string;

  /** Should we show a fill handle if appropriate? */
  isFillEnabled: boolean;

  /** Is this the primary cell? */
  isPrimary: boolean;

  /** Cell clicked */
  onClick: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /** Cell right clicked */
  onRightClick: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /** Cell double clicked */
  onDoubleClick: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /** Fill handle activated */
  onFillMouseDown: (event: React.MouseEvent<HTMLElement>) => void;

  /** Cell mouse down */
  onMouseDown: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /** Cell mouse enter */
  onMouseEnter: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

  /** Delegate to get if the cell is editable */
  isCellEditable?: (cellCoordinate: GridCoordinate) => boolean;

  /** Aria description, represented by id[s] of element[s] describing the current cell */
  ariaDescribedBy: string;

  /** The row span of the cell. Must be greater than 0 */
  rowSpan: number;

  /** The position of the cell within the selection. Null if there is no selection or the cell is not within one */
  selectionPosition: CellRegionPosition;

  /** Is the cell selectable? */
  selectable: boolean;

  /** Additional style attributes */
  style?: React.CSSProperties;

  /** Defines the border, background color etc. used for cells and headers */
  theme: GridTheme;

  /** Width of the cell in pixels */
  width: number;

  /**
   * Canary of the grid, gets updated when the grid receives new data,
   * Used to check if Cell should update when new props are passed
   */
  dirtyCanary: any;

  /** The type of the grid cell. */
  role: string;
}

/**
 * Cell component for use within BaseGrid
 * Contains arbitrary content as children
 */
export class Cell extends BaseComponent<ICellProps, {}> {
  /**
   * The container of the cell
   */
  public readonly container: HTMLDivElement;

  public name(): string {
    return 'Cell';
  }

  public shouldComponentUpdate(nextProps: ICellProps, nextState: {}, nextContext: any): boolean {
    return nextProps.dirtyCanary !== this.props.dirtyCanary ||
      nextProps.className !== this.props.className ||
      nextProps.editing ||
      nextProps.editing !== this.props.editing ||
      nextProps.isPrimary ||
      nextProps.isPrimary !== this.props.isPrimary ||
      nextProps.rowSpan !== this.props.rowSpan ||
      nextProps.selectable !== this.props.selectable ||
      nextProps.width !== this.props.width ||
      !_.isEqual(nextProps.coordinate, this.props.coordinate) ||
      !_.isEqual(nextProps.fillPosition, this.props.fillPosition) ||
      !_.isEqual(nextProps.selectionPosition, this.props.selectionPosition);
  }

  protected renderComponent(): JSX.Element {
    const {
      children,
      coordinate,
      className,
      editing,
      fillPosition,
      isFillEnabled,
      isPrimary,
      height,
      id,
      onClick,
      onRightClick,
      onDoubleClick,
      onFillMouseDown,
      onMouseDown,
      onMouseEnter,
      isCellEditable,
      rowSpan,
      selectable,
      selectionPosition,
      theme,
      width,
      role,
      ariaDescribedBy
    } = this.props;

    let {
      ariaAndDataAttributes
    } = this.props;

    const borderClassNameMapping: CellClassMapping =
      this._getBorderClassName(fillPosition, selectionPosition, editing, isPrimary, selectable);

    const style: React.CSSProperties = this._getCellStyle(rowSpan, height, width, theme, borderClassNameMapping);

    let isCellEditableValue = PropUtils.getValueFromAccessor(isCellEditable, coordinate);
    isCellEditableValue = !(isCellEditableValue === false); // Make isCellEditableValue true if it's undefined

    const cellClassName: string = css('grid-cell', borderClassNameMapping, className);

    if (!ariaAndDataAttributes) {
      ariaAndDataAttributes = {};
    }

    // Tree item is not allowed to have read only set
    if (role !== GridConstants.TREEITEM_ROLE && ariaAndDataAttributes[GridConstants.ARIA_READONLY] === null) {
      ariaAndDataAttributes[GridConstants.ARIA_READONLY] = !isCellEditableValue ? 'true' : 'false';
    }

    return (
      <div
        id={ id }
        ref={ this.resolveRef(this, 'container') }
        { ...getNativeProps(ariaAndDataAttributes, []) }
        aria-selected={ !!selectionPosition }
        aria-describedby={ PropUtils.getValueFromAccessor(ariaDescribedBy, coordinate) }
        aria-colindex={ coordinate.columnIndex + 1 }
        aria-rowindex={ coordinate.rowIndex + 1 }
        className={ cellClassName }
        onBlur={ this._onBlur }
        onClick={ (event: React.MouseEvent<HTMLElement>) => onClick && onClick(coordinate, event) }
        onDoubleClick={ (event: React.MouseEvent<HTMLElement>) => onDoubleClick && onDoubleClick(coordinate, event) }
        onContextMenu={ (event: React.MouseEvent<HTMLElement>) => onRightClick && onRightClick(coordinate, event) }
        onMouseDown={ (event: React.MouseEvent<HTMLElement>) => onMouseDown && onMouseDown(coordinate, event) }
        onMouseEnter={ (event: React.MouseEvent<HTMLElement>) => onMouseEnter && onMouseEnter(coordinate, event) }
        role={ role }
        style={ style }
        key={ id }
      >
        {/* Render the cell content */ }
        { children &&
          <div className="grid-cell-content">
            { children }
          </div>
        }

        {/* Render the fill handle if it is enabled */ }
        { isFillEnabled && selectionPosition && selectionPosition.right && selectionPosition.bottom &&
          <div
            className="grid-cell-fill-handle"
            onMouseDown={ onFillMouseDown }
            style={ { backgroundColor: theme.selectionBorderColor } }
          />
        }
      </div>
    );
  }

  /**
   * Returns the CSS style to apply to the cell
   * @param rowSpan Number of rows the cell spans
   * @param height The height of the cell
   * @param width The width of the cell
   * @param theme The styling theme, used to color the borders
   * @param cellClassMapping The mapping of the cell classes based on the selection position of the cell
   */
  private _getCellStyle(rowSpan: number, height: number, width: number, theme: GridTheme,
    cellClassMapping: CellClassMapping): React.CSSProperties {
    const style: React.CSSProperties = {
      border: rowSpan === 0 ? 0 : '',
      height: height * rowSpan,
      padding: rowSpan === 0 ? 0 : '',
      width: width,
      borderColor: rowSpan === 0 ? '' : theme.borderColor
    };

    if (rowSpan !== 0) {
      if (cellClassMapping.editing) {
        style.borderColor = theme.selectionBorderColor;
      } else {
        RtlUtils.setRTLSafeBorderLeft(style, null, null, cellClassMapping.selectionEdgeLeft ?
          theme.selectionBorderColor : theme.borderColor);

        RtlUtils.setRTLSafeBorderRight(style, null, null, cellClassMapping.selectionEdgeRight ?
          theme.selectionBorderColor : theme.borderColor);

        style.borderTopColor = cellClassMapping.selectionEdgeTop ? theme.selectionBorderColor :
          theme.borderColor;

        style.borderBottomColor = cellClassMapping.selectionEdgeBottom ? theme.selectionBorderColor :
          theme.borderColor;

        if (cellClassMapping.primary) {
          style.backgroundColor = theme.primaryCellBackgroundColor;
        } else if (cellClassMapping.selected) {
          style.backgroundColor = theme.selectedCellsBackgroundColor;
        }
      }
    }

    return _.merge(style, this.props.style);
  }

  /**
   * Get the class name for the cell
   * @param fillPosition The position of the cell within the fill region
   * @param selectionPosition The position of the cell within the selection
   * @param editing Is the cell being edited?
   * @param isPrimary Is the cell the primary cell?
   * @param selectable Is the cell selectable?
   */
  private _getBorderClassName(fillPosition: CellRegionPosition, selectionPosition: CellRegionPosition,
    editing: boolean, isPrimary: boolean, selectable: boolean): CellClassMapping {
    if (editing) {
      return {
        editing: true
      };
    }

    if (selectionPosition) {
      return {
        selected: selectionPosition.inRegion,
        primary: isPrimary,
        selectionEdgeLeft: selectionPosition.inRegion && selectionPosition.left,
        selectionEdgeRight: selectionPosition.inRegion && selectionPosition.right,
        selectionEdgeTop: selectionPosition.inRegion && selectionPosition.top,
        selectionEdgeBottom: selectionPosition.inRegion && selectionPosition.bottom,
        selectable: selectable
      };
    }

    if (fillPosition) {
      return {
        selectionEdgeLeft: fillPosition.inRegion && fillPosition.left,
        selectionEdgeRight: fillPosition.inRegion && fillPosition.right,
        selectionEdgeTop: fillPosition.inRegion && fillPosition.top,
        selectionEdgeBottom: fillPosition.inRegion && fillPosition.bottom,
        selectable: selectable
      };
    }

    return {
      primary: isPrimary,
      selectable: selectable
    };
  }

  /**
   * Stop propagation of blur events
   * BUG: IE sends too many onBlur events, even when items are not focusable
   * or do not have focus.
   * This is a workaround to prevent this behavior
   */
  private _onBlur(event: React.FocusEvent<HTMLElement>): void {
    event.stopPropagation();
  }
}

type CellClassMapping = {
  editing?: boolean,
  selected?: boolean,
  selectable?: boolean,
  primary?: boolean,
  selectionEdgeLeft?: boolean,
  selectionEdgeRight?: boolean,
  selectionEdgeTop?: boolean,
  selectionEdgeBottom?: boolean
};