import * as _ from 'lodash';
import * as React from 'react';

// components
import { Facepile, IFacepilePersona, OverflowButtonType } from 'office-ui-fabric-react/lib/Facepile';
import { PersonaSize, PersonaInitialsColor } from 'office-ui-fabric-react/lib/Persona';
import { IResource } from '../../controls/resourcePicker/IResource';
import { StringUtils } from '../../utilities/StringUtils';

// controls
import { BaseComponent } from '../../utilities/BaseComponent';

/**
 * Maximum number of personas to show in the grid cell.
 * Setting this high so that Facepile cells will only be
 * limited by the width of the grid cell per requirements.
 */
export const MAX_PERSONAS: number = 99;

/**
 * The rendered width of face pile coin per persona size.
 */
export const PERSONA_RENDERED_WIDTH: _.Dictionary<number> = {};
PERSONA_RENDERED_WIDTH[PersonaSize.size24] = 35;

/**
 * Length of facepile at which the persona details are to be shown
 */
export const FACEPILE_LENGTH_TO_SHOW_DETAILS_AT: number = 1;

export interface IResourcePileProps {
  resources: IResource[];
  total: number;
  width: number;
}

export class ResourcePile extends BaseComponent<IResourcePileProps, {}> {
  constructor(props: IResourcePileProps, context: any) {
    super(props, context);
  }

  /**
   * Name of the component
   * @returns {string} The name of this component
   */
  public name(): string {
    return 'ResourcePile';
  }
  protected renderComponent(): JSX.Element {
    const { resources, width, total } = this.props;
    // show details only if number of assigned resources equals to FACEPILE_LENGTH_TO_SHOW_DETAILS_AT
    let showPersonalDetails: boolean = resources.length === FACEPILE_LENGTH_TO_SHOW_DETAILS_AT;

    let maxPersonas = Math.floor(width / PERSONA_RENDERED_WIDTH[PersonaSize.size24]);

    let personas = _.map(
      resources,
      (resource: IResource): IFacepilePersona => {
        return {
          personaName: resource.name,
          imageInitials: StringUtils.parseInitialsFromName(resource.name),
          data: resource.name,
          imageUrl: resource.imgUrl
        };
      }
    );

    if (resources.length > maxPersonas) {
      let overFlowCount = (total || resources.length) - maxPersonas + 1;
      overFlowCount = Math.min(MAX_PERSONAS, overFlowCount);
      personas = [
        ...personas.slice(0, maxPersonas - 1),
        {
          personaName: `+${overFlowCount}`,
          imageInitials: `+${overFlowCount}`,
          initialsColor: PersonaInitialsColor.lightBlue
        }
      ];
    }

    return (
      <Facepile
        maxDisplayablePersonas={maxPersonas || MAX_PERSONAS}
        personas={personas}
        personaSize={PersonaSize.size32}
        getPersonaProps={(persona: IFacepilePersona) => {
          return {
            hidePersonaDetails: !showPersonalDetails,
            imageShouldFadeIn: false,
            primaryText: persona.personaName,
            imageUrl: persona.imageUrl
          };
        }}
        overflowButtonType={OverflowButtonType.descriptive}
      />
    );
  }
}
