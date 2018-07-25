import * as React from 'react';
import { BaseComponent } from '../utilities/BaseComponent';
import { css } from '@uifabric/utilities/lib-commonjs/css';
import { RtlUtils } from '../utilities/RtlUtils';
import { GridTheme } from '../common/Common';

export interface IRowHeaderCellProps extends React.Props<RowHeaderCell> {
    /** Optional class name to be added to this cell */
    className?: string;

    /** The height of the cell in pixels */
    height: number;

    /** Is this row active? if true, it renders the right/left border on the row header cell in LTR/RTL */
    isRowActive: boolean;

    /** Defines the default border color, active column border color etc. */
    theme: GridTheme;

    /** The width of the cell in pixels */
    width: number;

    /** The optional row index of the header */
    rowIndex?: number;

    /** Id of the row */
    id: string;

    /**
     * Optional callback for mouse down event on row header
     */
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;

    /**
     * Optional callback for mouse enter event on row header
     */
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;

    /**
     * Optional callback for context menu event on row header
     */
    onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Renders the row header cell
 */
export class RowHeaderCell extends BaseComponent<IRowHeaderCellProps, {}> {
    public name(): string {
        return 'RowHeaderCell';
    }

    protected renderComponent(): JSX.Element {
        const {
            id,
            children,
            className,
            height,
            isRowActive,
            rowIndex,
            theme,
            width,
            onMouseDown,
            onMouseEnter,
            onContextMenu
        } = this.props;

        let cellStyle: React.CSSProperties = {
            width: width,
            height: height,
            borderColor: theme.borderColor
        };

        let cellContentStyle: React.CSSProperties = {};

        if (isRowActive) {
            cellStyle.backgroundColor = theme.selectedHeaderBackgroundColor;
            cellContentStyle.color = theme.selectedHeaderTextColor;
        } else {
            RtlUtils.setRTLSafeBorderRight(cellStyle, null, null, theme.borderColor);
        }

        return (
            <div
                id={ id }
                className={ css('grid-row-header-cell',
                    {
                        'grid-row-header-cell--active': isRowActive
                    },
                    className
                ) }
                aria-rowindex={ rowIndex }
                role='rowheader'
                style={ cellStyle }
                onMouseDown={ onMouseDown }
                onMouseEnter={ onMouseEnter }
                onContextMenu={ onContextMenu }
            >
                <div className='grid-row-header-cell-content'
                    style={ cellContentStyle }>
                    { children }
                </div>
            </div>
        );
    }
}