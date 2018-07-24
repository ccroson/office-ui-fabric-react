import "./ResourceList.scss";

import * as _ from "lodash";
import * as React from "react";

// Components
import { BaseComponent } from "../../utilities/BaseComponent";
import { FocusZone, FocusZoneDirection } from "office-ui-fabric-react/lib-commonjs/components/FocusZone/index";
import { IconButton } from "office-ui-fabric-react/lib-commonjs/components/Button/index";
import { Persona } from "office-ui-fabric-react/lib-commonjs/components/Persona/index";
import { IPersonaProps, PersonaInitialsColor, PersonaSize } from "office-ui-fabric-react/lib-commonjs/components/Persona/index";

// Constants
import { Icons } from "../../constants/IconConstants";

// Model
import { Identifiable } from "./Identifiable";

// Utilities
import { css } from "@uifabric/utilities/lib-commonjs/css";

export interface IResourceListProps {
    /** Use smaller personas size for this group */
    compactMode: boolean;
    /** Top of the list header text */
    listHeaderText: string;
    /** Show the header even if there's no resources */
    showHeaderIfNoData?: boolean;
    /** Surpress the display of resources until filtered */
    suppressDataDisplayUntilSearch?: boolean;
    /** List of personas */
    resourceList: Identifiable<IPersonaProps>[];
    /** Maximum results to display */
    maxSearchResults?: number;
    /** Callback when list item is clicked */
    onItemClick?: (resourceId: string) => void;
    /** Callback when remove is clicked */
    onItemRemoveClick?: (resourceId: string) => void;
    /** Callback when list item is keyed */
    onItemKeyUp?: (ev: React.KeyboardEvent<HTMLElement>, resourceId: string) => boolean;
    /** ARIA text for text on clickable item in resource list */
    resourceAriaLabel?: string;
}

export interface IResourceListState { }

export const MAX_SEARCH_RESULT = 999;

/**
 * Component that displays a vertical list of project resources
 */
export class ResourceList extends BaseComponent<IResourceListProps, IResourceListState> {
    public static defaultProps = {
        compactMode: false,
        showHeaderIfNoData: true,
        onItemClick: null,
        onItemRemove: null
    };

    constructor(props: IResourceListProps, context?: any) {
        super(props, context);
    }

    /**
     * Name of the component
     */
    public name(): string {
        return "ResourceList";
    }

    protected renderComponent(): JSX.Element {
        const { listHeaderText, resourceList } = this.props;

        return (
            <div className="resource-list-result-group">
                { this.renderHeader() }
                <FocusZone
                    aria-label={ listHeaderText }
                    className="resource-list-results"
                    direction={ FocusZoneDirection.vertical }
                    isCircularNavigation={ false }
                >
                    { _.map(resourceList.slice(0, this.props.maxSearchResults || MAX_SEARCH_RESULT), this.renderResource) }
                </FocusZone>
            </div>
        );
    }

    /**
     * Render an icon button
     * @param {Identifiable<IPersonaProps>} resource The resource the button is for
     * @param {string} iconName Name of the Fabric icon to use: https://dev.office.com/fabric#/styles/icons
     * @param {string} className Name of class to add to the IconButton control
     * @param {(id: string) => void} onClick Action to invoke when IconButton is clicked
     * @returns the icon component
     */
    private renderRemoveButton(resource: Identifiable<IPersonaProps>) {
        const { onItemRemoveClick } = this.props;

        return (
            <IconButton
                iconProps={ { iconName: Icons.Cancel } }
                aria-hidden={ true }
                className={ css("resource-list-cancel", { hidden: !onItemRemoveClick }) }
                data-is-focusable={ false }
                onClick={ () => {
                    if (onItemRemoveClick && resource) {
                        onItemRemoveClick(resource.id);
                    }
                } }
            />
        );
    }

    /**
     * Render the resource group header
     */
    private renderHeader() {
        const { listHeaderText, resourceList, showHeaderIfNoData } = this.props;

        return (showHeaderIfNoData || _.size(resourceList)) && listHeaderText ? (
            <div aria-label={ listHeaderText } className="resource-list-result-group-title" tabIndex={ 0 }>
                { listHeaderText }
            </div>
        ) : null;
    }

    /**
     * Render the individual resource item
     * @param {Identifiable<IPersonaProps>} resource The resource the button is for
     * @param resourceIndex The index of the group
     */
    private renderResource = (resource: Identifiable<IPersonaProps>, resourceIndex: number) => {
        const { resourceAriaLabel, compactMode, onItemClick, onItemKeyUp } = this.props;
        let buttonProps = onItemKeyUp
            ? {
                onKeyUp: (ev: React.KeyboardEvent<HTMLElement>) => {
                    if (resource) {
                        onItemKeyUp(ev, resource.id);
                    }
                },
                // Disable focus zone confirmation action onClick
                onMouseUp: () => {
                    if (onItemClick && resource) {
                        onItemClick(resource.id);
                    }
                }
            }
            : {
                onClick: () => {
                    if (onItemClick && resource) {
                        onItemClick(resource.id);
                    }
                }
            };

        return (
            <div key={ resource.id || resourceIndex } className="resource-list-result">
                <button
                    title={ resource.text }
                    aria-label={ `${resource.text} ${resourceAriaLabel}` }
                    className="resource-list-persona"
                    { ...buttonProps }
                >
                    <Persona
                        aria-label={ resource.text }
                        key={ resource.id }
                        imageInitials={ resource.imageInitials }
                        imageUrl={ resource.imageUrl }
                        text={ resource.text }
                        secondaryText={ resource.secondaryText }
                        initialsColor={ PersonaInitialsColor.lightBlue }
                        size={ compactMode ? PersonaSize.extraSmall : PersonaSize.small }
                    />
                </button>
                { this.renderRemoveButton(resource) }
            </div>
        );
    };
}
