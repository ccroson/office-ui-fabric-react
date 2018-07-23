import './ResourceEditor.scss';

import * as _ from 'lodash';
import * as React from 'react';

// constants
import { KeyCode } from '../../constants/KeyboardConstants';
import { GridTheme } from '../../common/Types';

// controls
import { Callout, DirectionalHint } from 'office-ui-fabric-react/lib/Callout';
import { Button } from 'office-ui-fabric-react/lib/Button';
import { IPersonaProps } from 'office-ui-fabric-react/lib/Persona';
import { IResourceListProps } from '../../controls/resourcePicker/ResourceList';
import { PeoplePicker } from '../../controls/resourcePicker/PeoplePicker';
import { ResourcePile } from './ResourcePile';
import { Identifiable } from '../../controls/resourcePicker/Identifiable';
import { IResource } from '../../controls/resourcePicker/IResource';
import { ResourceEditorData, IAssignedResourcesList, IUnassignedResourcesList } from './ResourceEditorData';

// utilities
import { autobind, css } from '../../../../Utilities';
import { BaseComponent } from '../../utilities/BaseComponent';
import { KeyboardUtils } from '../../utilities/KeyboardUtils';

import { GridAction, PickerOpenedAction } from '../../actions/GridActions';

/**
 * The options needed for the the component.
 */
export type IResourceEditorOptions = {
  /**
   * Labels for static components
   */
  labels: ILabels;

  /**
   * Callback for create
   */
  onCreate: (rowId: string, searchText: string) => void;

  /**
   * Callback for resource search
   */
  onFetchSearchedResources: (rowId: string, id: string) => void;
};

/**
 * Labels.
 */
export interface ILabels {
  /**
   * Label for resource not found.
   */
  resourceNotFoundLabel: string;

  /**
   * Label for resource create and assign.
   */
  resourceCreateAndAssignLabel: string;

  /**
   * Label for search place holder.
   */
  searchPlaceHolderLabel: string;
}

/**
 * The props needed to render this component
 */
export interface IResourceEditorProps {
  /**
   * Boolean for whether or not the callout should be opened
   */
  forceCalloutOpen?: boolean;

  /**
   * Pending value for the cell to possibly render
   */
  searchValue: string;

  /**
   * The value to display in the editor
   */
  value: ResourceEditorData;

  /**
   * Options for editor
   */
  options: IResourceEditorOptions;

  /**
   * The optional action performed by the user that the editor may react to
   */
  action?: GridAction;

  /**
   * Delegate to be called when cell is clicked by the user
   */
  onCellClick?: () => void;

  /**
   * Callback to cancel editing of the cell
   */
  onEditCancelled?: () => void;

  /**
   * The column width
   */
  columnWidth: number;

  /**
   * Theme information for icon style
   */
  theme?: GridTheme;
}

/**
 * The states required by this component
 */
export interface IResourceEditorStates {
  /**
   * Search string to find users
   */
  search: string;

  /**
   * Target element to pin the people picker to
   */
  peoplePickerTargetElement: HTMLElement;

  /**
   * Is the resource editor callout shown?
   */
  calloutOpened: boolean;
}

/**
 * The user filter. Renders a search box and callout with filtered users.
 */
export class ResourceEditor extends BaseComponent<IResourceEditorProps, IResourceEditorStates> {
  public static defaultProps: IResourceEditorProps = {
    searchValue: null,
    value: null,
    options: null,
    columnWidth: 0
  };

  /**
   * Wraps the facepile component
   */
  public readonly facepileWrapper: HTMLElement;

  /**
   * The callout control popup
   */
  public readonly callout: Callout;

  /**
   * Creates an instance of ResourceEditor.
   * @param {IResourceEditorProps} props the props for ResourceEditor
   * @param {*} context
   */
  constructor(props: IResourceEditorProps, context: any) {
    super(props, context);
    this.state = {
      peoplePickerTargetElement: null,
      search: props.searchValue,
      calloutOpened: props.action != null && props.action.type === PickerOpenedAction.type
    };
  }

  /**
   * Name of the component
   * @returns {string} The name of this component
   */
  public name(): string {
    return 'ResourceEditor';
  }

  public componentDidMount() {
    // The facepile wrapper ref is set only after the component renders so once the facepile wrapper is available set it as the target element for the people picker
    if (this.facepileWrapper != null) {
      this.setState({ peoplePickerTargetElement: this.facepileWrapper });
    }
  }

  /**
   * Open the callout if was fired and callout is not currently open
   */
  public componentWillReceiveProps(nextProps: IResourceEditorProps) {
    const { calloutOpened } = this.state;
    const { forceCalloutOpen } = this.props;

    if (nextProps.forceCalloutOpen !== forceCalloutOpen) {
      this.setState({ calloutOpened: nextProps.forceCalloutOpen });
    } else if (nextProps.action && nextProps.action.type === PickerOpenedAction.type && !calloutOpened) {
      this.setState({ calloutOpened: true });
    }
  }

  protected renderComponent(): JSX.Element {
    const { value } = this.props;
    let iconStyle: React.CSSProperties = this.props.theme
      ? {
          color: this.props.theme.selectionBorderColor,
          fontSize: this.props.theme.iconSize
        }
      : {};
    return (
      <div
        className="resource-editor-container"
        ref={this.resolveRef(this, 'facepileWrapper')}
        onClick={this.onCellClick}
      >
        <div className="resource-editor-facepile">
          <ResourcePile resources={value.assignedResources} total={value.total} width={this.props.columnWidth} />
        </div>
        <i className={css('ms-Icon ms-Icon--PeopleAdd')} style={iconStyle} />
        {this.renderCallout(value)}
      </div>
    );
  }

  /**
   * Render the dropdown callout if visible
   * @param {ResourceEditorData} cellData the cell data.
   * @returns {JSX.Element} the editor cell JSX.Element.
   */
  private renderCallout(cellData: ResourceEditorData): JSX.Element {
    const { forceCalloutOpen, searchValue } = this.props;

    const { calloutOpened = false, peoplePickerTargetElement } = this.state;

    return (
      (calloutOpened || forceCalloutOpen) && (
        <Callout
          directionalHint={DirectionalHint.bottomLeftEdge}
          isBeakVisible={false}
          target={peoplePickerTargetElement}
          onDismiss={this.onDismiss}
          calloutMaxHeight={600}
          ref={this.resolveRef(this, 'callout')}
        >
          <PeoplePicker
            resourceLists={this.getUserResourceList()}
            fetchFilteredResources={this.fetchFilteredResources}
            onSearchStringChanged={this.updateSearchString}
            filterBoxPlaceholderText={this.labels.searchPlaceHolderLabel}
            searchBoxNoResultsText={this.labels.resourceNotFoundLabel}
            onFilter={this.filterResource}
            onFilterMapResults={this.resourceTransform}
            searchedResourcesFetched={true}
            shouldFocusOnMount={true}
            searchValue={searchValue}
            onDismiss={this.onDismiss}
          />
          {this.props.options.onCreate && (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                marginBottom: '3px'
              }}
            >
              <Button
                className="resource-create-assign-button"
                primary={true}
                label={this.labels.resourceCreateAndAssignLabel}
                text={this.labels.resourceCreateAndAssignLabel}
                value={this.labels.resourceCreateAndAssignLabel}
                onClick={() => this.createResource()}
              />
            </div>
          )}
        </Callout>
      )
    );
  }

  private createResource(): void {
    this.props.options.onCreate(this.props.value.rowId, this.state.search);
    this.onDismiss();
  }

  private get labels(): ILabels {
    return this.props.options.labels;
  }

  private get assignedResourcesList(): IAssignedResourcesList {
    return this.props.value.assignedResourcesSearchList;
  }

  private get unassignedResourcesLists(): IUnassignedResourcesList[] {
    return this.props.value.unassignedResourcesSearchLists;
  }

  /** Callback to fetch filtered resources when a filter is typed */
  @autobind
  private fetchFilteredResources(searchString: string): void {
    const { value } = this.props;
    this.props.options.onFetchSearchedResources(value.rowId, searchString);
  }

  /** Callback to update the searchString */
  @autobind
  private updateSearchString(searchString): void {
    this.setState({ search: searchString });
  }

  /** Convert list of Resource objects to Identifiable objects */
  private getIdentifiable(userInfos: IResource[]): Identifiable<IPersonaProps>[] {
    let identifiableList: Identifiable<IPersonaProps>[] = _.map(userInfos, (user: IResource) => {
      return {
        id: user.id,
        primaryText: user.name,
        imageUrl: user.imgUrl,
        secondaryText: user.title,
        tertiaryText: user.email,
        presence: user.presence
      };
    });
    return identifiableList;
  }

  /** Convert list of Resource objects to IResourceListProps objects */
  private getUserResourceList(): IResourceListProps[] {
    const { value } = this.props;

    const { search } = this.state;

    let assigned: IResourceListProps = {
      compactMode: false,
      listHeaderText: this.assignedResourcesList.label,
      resourceList: this.getIdentifiable(this.assignedResourcesList.resources()), // List of personas
      onItemRemoveClick: (resourceId: string) => this.assignedResourcesList.onRemove(value.rowId, resourceId), // Callback when remove is clicked
      showHeaderIfNoData: false,
      maxSearchResults: this.assignedResourcesList.maxResult,
      onItemKeyUp: KeyboardUtils.executeWhenAllowedKeyPressed([KeyCode.DELETE], (resourceId: string) => {
        this.assignedResourcesList.onRemove(value.rowId, resourceId);
        return true;
      })
    };

    let unassignedLists = _(this.unassignedResourcesLists)
      .filter((unassignedResourcesList: IUnassignedResourcesList) => unassignedResourcesList.isVisible(search))
      .map((unassignedResourceList: IUnassignedResourcesList) => {
        return {
          compactMode: false,
          listHeaderText: unassignedResourceList.label,
          resourceList: this.getIdentifiable(unassignedResourceList.resources()), // List of personas
          onItemClick: (resourceId: string) => unassignedResourceList.onClick(value.rowId, resourceId), // Callback when non team member is clicked
          onItemKeyUp: KeyboardUtils.executeWhenAllowedKeyPressed([KeyCode.ENTER], (resourceId: string) => {
            unassignedResourceList.onClick(value.rowId, resourceId);
            return true;
          }),
          showHeaderIfNoData: false,
          maxSearchResults: unassignedResourceList.maxResult
        } as IResourceListProps;
      })
      .value();
    return [assigned, ...unassignedLists];
  }

  /**
   * Used as a callback to filter each resource inside the People/Resource Picker component.
   * @param filterStr The filter string to search/evaluate against a resource item.
   * @param { Identifiable<IPersonaProps> } resource The resource to be evaluated for an iteration.
   */
  private filterResource(filterStr: string, resource: Identifiable<IPersonaProps>): boolean {
    if (!filterStr) {
      return false;
    }
    if (!resource) {
      return false;
    }

    filterStr = filterStr.toUpperCase();
    return resource && (resource.primaryText && resource.primaryText.toUpperCase().indexOf(filterStr) !== -1);
  }

  /**
   * This mapping function will be applied to all the items/resources while searching/filtering the resource list inside the People/Resource picker.
   * This function will make some fields visible while searching (email in this specific case).
   * @param { Identifiable<IPersonaProps> } resource The resource to be evaluated for an iteration.
   * @param index Index of the resource in the resources array.
   * @param { Identifiable<IPersonaProps>[] } resourceList Identifiable list of resources being transformed.
   * @return { Identifiable<IPersonaProps> } Identifiable transformed resource.
   */
  private resourceTransform(
    resource: Identifiable<IPersonaProps>,
    index: number,
    resourceList: Identifiable<IPersonaProps>[]
  ): Identifiable<IPersonaProps> {
    return {
      id: resource.id,
      primaryText: resource.primaryText,
      // Swapping secondaryText and tertiaryText values to show email address when filtering
      secondaryText: resource.tertiaryText,
      tertiaryText: resource.secondaryText,
      imageInitials: resource.imageInitials,
      imageUrl: resource.imageUrl
    };
  }

  /**
   * When the cell is clicked, toggle the dropdown callout
   */
  @autobind
  private onCellClick(): void {
    const { onCellClick } = this.props;

    const { calloutOpened } = this.state;

    this.setState({ calloutOpened: !calloutOpened });

    if (onCellClick) {
      onCellClick();
    }
  }

  /**
   * Dismiss the callout
   */
  @autobind
  private onDismiss(): void {
    const { onEditCancelled } = this.props;

    if (onEditCancelled) {
      onEditCancelled();
    }
  }
}
