import * as React from "react";
import { BaseComponent } from "../utilities/BaseComponent";
import { css } from "@uifabric/utilities/lib-commonjs/css";
import { getRTL } from "@uifabric/utilities/lib-commonjs/rtl";
import { GridCoordinate, GridTheme } from "../common/Common";

export interface IColumnHeaderCellProps extends React.Props<ColumnHeaderCell> {
    /** The column index of this header */
    columnIndex: number;

    /** The class name for this header */
    className: string;

    /** Is the header cell being dragged over? */
    draggedOver: boolean;

    /** Is this column active? if true, it renders the bottom border on the column header cell */
    isColumnActive: boolean;

    /** Is this column header selected? if true, it renders all the borders on the column header cell */
    isSelected: boolean;

    /** Can the header cell be dragged? */
    isDragEnabled: boolean;

    /** Can the header cell be resized? */
    isResizeEnabled: boolean;

    /** Header click */
    onClick?: (columnIndex: number, event: React.MouseEvent<HTMLElement>) => void;

    /** Header right click */
    onRightClick?: (columnIndex: number, event: React.MouseEvent<HTMLElement>) => void;

    /** Fired when a drag is initiated on the header */
    onDragStart: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when a drag is finished on the header */
    onDragFinish: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when a header cell is initially dragged over this cell */
    onDragEnter: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when a header cell is dragged over this cell */
    onDragOver: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when a header cell leaves from being dragged over this cell */
    onDragLeave?: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when a header is dropped on this one */
    onDrop: (event: React.DragEvent<HTMLElement>) => void;

    /** Fired when the user presses their mouse on the resize handle */
    onResizeHandleMouseDown: (columnIndex: number, event: React.MouseEvent<HTMLElement>) => void;

    /** Fired when the user clicks on the header cell */
    onMouseDown: (cellCoordinate: GridCoordinate, event: React.MouseEvent<HTMLElement>) => void;

    /** Defines the default border color, active column border color etc. */
    theme: GridTheme;

    /** The width of the header cell in pixels */
    width: number;

    /** The id of the header cell */
    id: string;
}

/**
 * A column header cell component for use within the AbstractGrid component
 * Contains arbitrary content as children
 */
export class ColumnHeaderCell extends BaseComponent<IColumnHeaderCellProps, {}> {
    public name(): string {
        return "ColumnHeaderCell";
    }

    protected renderComponent(): JSX.Element {
        const {
            children,
            className,
            columnIndex,
            draggedOver,
            isColumnActive,
            isSelected,
            isDragEnabled,
            isResizeEnabled,
            onClick,
            onRightClick,
            onDragStart,
            onDragFinish,
            onDragEnter,
            onDragOver,
            onDragLeave,
            onDrop,
            onResizeHandleMouseDown,
            onMouseDown,
            theme,
            id
        } = this.props;

        let cellContentStyle: React.CSSProperties = {};
        if (isColumnActive) {
            cellContentStyle.color = theme.selectedHeaderTextColor;
        }

        return (
            <div
                id={ id }
                data-header-id={ columnIndex }
                draggable={ isDragEnabled }
                role="columnheader"
                aria-colindex={ columnIndex + 1 }
                aria-rowindex={ 0 }
                aria-selected={ !!isSelected }
                onDragStart={ (event: React.DragEvent<HTMLElement>) => onDragStart(event) }
                onDragEnd={ (event: React.DragEvent<HTMLElement>) => onDragFinish(event) }
                onDragEnter={ (event: React.DragEvent<HTMLElement>) => onDragEnter(event) }
                onDragOver={ (event: React.DragEvent<HTMLElement>) => onDragOver(event) }
                onDragLeave={ (event: React.DragEvent<HTMLElement>) => onDragLeave(event) }
                onDrop={ (event: React.DragEvent<HTMLElement>) => onDrop(event) }
                className={
                    css(
                        "grid-column-header-cell",
                        {
                            "grid-column-header-cell--clickable": !!onClick || !!onRightClick,
                            "grid-column-header-cell--dragover": draggedOver,
                            "grid-column-header-cell--active": isColumnActive
                        },
                        className
                    )
                }
                onMouseDown={ (event: React.MouseEvent<HTMLElement>) => {
                    return onMouseDown && onMouseDown(new GridCoordinate(0, columnIndex, true), event);
                } }
                onClick={ (event: React.MouseEvent<HTMLElement>) => onClick && onClick(columnIndex, event) }
                onContextMenu={ (event: React.MouseEvent<HTMLElement>) => onRightClick && onRightClick(columnIndex, event) }
                style={ this.getCellStyle() }>
                {/* Render the header content */ }
                <div className="grid-column-header-cell-content" style={ cellContentStyle }>
                    { children }
                </div>

                {/* Render the drag handles if they are enabled */ }
                <div
                    className={ css("grid-column-header-drag-handle", { "drag-handle--draggable": isResizeEnabled }) }
                    onMouseDown={ isResizeEnabled ? (event: React.MouseEvent<HTMLElement>) => onResizeHandleMouseDown(columnIndex, event) : undefined }
                    onClick={ (event: React.MouseEvent<HTMLElement>) => event.stopPropagation() }
                    style={ { backgroundColor: theme.borderColor } }
                    aria-hidden="true"
                />
            </div>
        );
    }

    /**
     * Get the inline style for the header cell
     */
    private getCellStyle() {
        const {
            draggedOver,
            isColumnActive,
            theme,
            width
        } = this.props;

        let cellStyle: React.CSSProperties = {
            width: width,
            borderTopColor: theme.borderColor,
            borderRightColor: theme.borderColor,
            borderBottomColor: theme.borderColor,
            borderLeftColor: theme.borderColor
        };

        if (isColumnActive) {
            cellStyle.backgroundColor = theme.selectedHeaderBackgroundColor;
        }

        if (draggedOver) {
            this.decorateWithDragTargetIndicator(cellStyle);
        }

        return cellStyle;
    }

    /**
     * Set the css style for a header cell being dragged
     * @param cellStyle CSSProperties object to set style for
     */
    private decorateWithDragTargetIndicator(cellStyle) {
        const {
            theme
        } = this.props;

        let dropLocationIndicatorWidth: number = 3;
        let dropLocationBorder: string = `solid ${dropLocationIndicatorWidth}px`;

        if (!getRTL()) {
            cellStyle.borderLeft = dropLocationBorder;
            cellStyle.borderLeftColor = theme.selectionBorderColor;
        } else {
            cellStyle.borderRight = dropLocationBorder;
            cellStyle.borderRightColor = dropLocationBorder;
        }
    }
}