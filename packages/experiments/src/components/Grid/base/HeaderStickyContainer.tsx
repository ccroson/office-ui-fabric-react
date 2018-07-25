import * as React from 'react';
import { BaseComponent } from '../utilities/BaseComponent';
import { css } from '@uifabric/utilities/lib-commonjs/css';
import { getRTL } from '@uifabric/utilities/lib-commonjs/rtl';
import { GridTheme } from '../common/Common';
import { GridConstants } from '../constants/GridConstants';

export interface IHeaderStickyContainerProps extends React.Props<HeaderStickyContainer> {
    /** The class name for the container */
    className: string;

    /**
     * Canary of the grid, gets updated when the grid receives new data,
     * Used to determine when to update the clientRects
     */
    dirtyCanary: any;

    /** The height of the container */
    height: number;

    /** Is the container fixed */
    isFixed: boolean;

    /**
     * The left space between this container and its parent,
     * In RTL, this is the space on the right
     */
    leftOffset: number;

    /**
     * The current left position of the scrollable parent
     * In RTL, this is the position from the right edge
     */
    scrollableViewLeft: number;

    /** The current top position of the scrollable parent */
    scrollableViewTop: number;

    /** The width of the scrollable parent */
    scrollableViewWidth: number;

    /** Defines the background color for the container */
    theme: GridTheme;

    /** The width of the container */
    width: number;
}

/**
 * Sticky container for the HeaderRow. For use within BaseGrid
 * Contains all the rendering logic for the sticky headers
 * Note: This is used only for Edge and IE, since they do not support position: sticky css property
 */
export class HeaderStickyContainer extends BaseComponent<IHeaderStickyContainerProps, {}> {
    /** Ref of the placeholder div */
    public readonly headerPlaceHolderRef: HTMLDivElement;

    /** Client Rect of the placeholder */
    private placeHolderClientRect: ClientRect;

    public name(): string {
        return 'HeaderStickyContainer';
    }

    /** Get the placeholder div reference */
    public get placeHolderRect(): ClientRect {
        if (!this.placeHolderClientRect) {
            this.placeHolderClientRect = this.headerPlaceHolderRef.getBoundingClientRect();
        }
        return this.placeHolderClientRect;
    }

    public componentDidUpdate(prevProps: IHeaderStickyContainerProps, prevState: {}): void {
        if (prevProps.dirtyCanary !== this.props.dirtyCanary ||
            prevProps.isFixed !== this.props.isFixed ||
            prevProps.leftOffset !== this.props.leftOffset ||
            prevProps.scrollableViewLeft !== this.props.scrollableViewLeft) {
            this.placeHolderClientRect = this.headerPlaceHolderRef.getBoundingClientRect();
        }
    }

    protected renderComponent(): JSX.Element {
        const {
            children,
            className,
            height,
            isFixed,
            leftOffset,
            scrollableViewLeft,
            scrollableViewTop,
            scrollableViewWidth,
            width
        } = this.props;

        if (isFixed) {
            // Render the container in fixed mode

            // Sticky styles
            const stickyContainerStyle: React.CSSProperties = {
                top: scrollableViewTop,
                width: scrollableViewWidth,
                height: height
            };
            const placeHolderElementStyle: React.CSSProperties = {
                height: height,
                width: width
            };

            const headerContentStyle: React.CSSProperties = {
                width: width
            };

            if (!getRTL()) {
                headerContentStyle.left = leftOffset;
                stickyContainerStyle.left = scrollableViewLeft;
            } else {
                headerContentStyle.right = leftOffset;
                stickyContainerStyle.right = scrollableViewLeft;
            }

            return (
                <div className='grid-header-container' style={ { width: width, height: height } } role={ GridConstants.ROWGROUP_ROLE }>
                    <div className={ css('sticky-container') } style={ stickyContainerStyle }>
                        <div className='grid-header-relative-container'>
                            <div style={ headerContentStyle } className={ css('grid-header grid-header--fixed', className) }>
                                { children }
                            </div>
                        </div>
                    </div>
                    <div className='grid-header-placeholder grid-header-placeholder--fixed'
                        ref={ this.resolveRef(this, 'headerPlaceHolderRef') }
                        style={ placeHolderElementStyle }>
                    </div>
                </div>
            );
        } else {
            // Render the container in regular mode
            return (
                <div className='grid-header-container'
                    style={ { height: height } }
                    role={ GridConstants.ROWGROUP_ROLE }
                >
                    <div className={ css('grid-header', className) }>
                        { children }
                    </div>
                    <div className='grid-header-placeholder'
                        ref={ this.resolveRef(this, 'headerPlaceHolderRef') }>
                    </div>
                </div>
            );
        }
    }
}