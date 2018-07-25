import * as React from 'react';
import * as  _ from 'lodash';

import { BaseComponent } from '../utilities/BaseComponent';
import { GridCoordinate } from '../common/Common';

export interface ISpacerCellProps {
    /** The coordinate of the empty cell */
    coordinate: GridCoordinate;

    /** The identifier of the empty cell */
    id: string;

    /** The width of the empty cell */
    width: number;
}

/**
 * An empty cell. Renders no content
 */
export class SpacerCell extends BaseComponent<ISpacerCellProps, {}> {
    public name(): string {
        return 'SpacerCell';
    }

    /**
     * Only update the empty cell if props change
     */
    public shouldComponentUpdate(nextProps: ISpacerCellProps): boolean {
        return !_.isEqual(this.props, nextProps);
    }

    protected renderComponent(): JSX.Element {
        const {
            id,
            width
        } = this.props;

        const style: React.CSSProperties = {
            width: width
        };

        return (
            <div
                id={ id }
                className="grid-cell grid-cell--hidden"
                /* tslint:disable:jsx-ban-props */
                style={ style }
            />
        );
    }
}