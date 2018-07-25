import * as React from 'react';
import { BaseComponent } from '../utilities/BaseComponent';
import { GridTheme } from '../common/Common';

export interface IHeaderRowProps extends React.Props<HeaderRow> {
    /** The height of this header row */
    height: number;

    /** Defines the border color */
    theme: GridTheme;

    /**
     * Is the header fixed on top of the scroll view.
     * This is not used in rendering, but used to determine if the cached layout properties should be updated after component updates
     */
    isHeaderFixed: boolean;

    /**
     * Canary of the grid, gets updated when the grid receives new data,
     * Used to determine when to update the clientRects
     */
    dirtyCanary: any;
}

/**
 * A header row component for use within the BaseGrid. Contains HeaderCells as children
 */
export class HeaderRow extends BaseComponent<IHeaderRowProps, {}> {
    /** Ref representing the rendered row */
    public readonly innerDiv: HTMLDivElement;

    /** Client Rect of the rendered row */
    private innerDivClientRect: ClientRect;

    public name(): string {
        return 'HeaderRow';
    }

    /** Get the rendered row height */
    public get height(): number {
        return this.innerDiv ? this.innerDiv.clientHeight : 0;
    }

    /** Get the rendered row width */
    public get width(): number {
        return this.rect ? this.rect.width : 0;
    }

    /** Get the rendered row client rect */
    public get rect(): ClientRect {
        if (!this.innerDivClientRect) {
            this.innerDivClientRect = this.innerDiv.getBoundingClientRect();
        }
        return this.innerDivClientRect;
    }

    public componentDidUpdate(prevProps: IHeaderRowProps, prevState: {}): void {
        if (
            prevProps.dirtyCanary !== this.props.dirtyCanary ||
            prevProps.isHeaderFixed !== this.props.isHeaderFixed
        ) {
            this.innerDivClientRect = this.innerDiv.getBoundingClientRect();
        }
    }

    protected renderComponent(): JSX.Element {
        const {
            children,
            height,
            theme
        } = this.props;

        const style: React.CSSProperties = {
            height: height,
            borderColor: theme.borderColor,
            backgroundColor: theme.backgroundColor
        };

        return (
            <div className='grid-header-row'
                role='row'
                style={ style }
                ref={ this.resolveRef(this, 'innerDiv') }
            >
                { children }
            </div>
        );
    }
}