import * as React from "react";
import { BaseComponent } from "../utilities/BaseComponent";
import { css } from "@uifabric/utilities/lib-commonjs/css";

export interface IHeaderContainerProps extends React.Props<HeaderContainer> {
    /** The class name for the grid header */
    className: string;

    /** The height of the container */
    height: number;

    /** Is the header container sticky */
    isSticky: boolean;

    /** Role of the header */
    role?: string;
}

/**
 * Container for the HeaderRow. For use within BaseGrid
 * Uses css - position: sticky, in case the header needs to stick on top of the scroll view
 * Note: This is not being used for IE and Edge browsers
 */
export class HeaderContainer extends BaseComponent<IHeaderContainerProps, {}> {

    public name(): string {
        return "HeaderContainer";
    }

    protected renderComponent(): JSX.Element {
        const {
            children,
            className,
            height,
            isSticky,
            role
        } = this.props;

        return (
            <div className={ css("grid-header-container", { "grid-header-container--sticky": isSticky }) }
                style={ { height: height } }
                role={ role }
            >
                <div className={ css("grid-header", className) }>
                    { children }
                </div>
            </div>
        );
    }
}