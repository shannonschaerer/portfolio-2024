import type { Schema, Struct } from '@strapi/strapi';

export interface ProfileAvailability extends Struct.ComponentSchema {
  collectionName: 'components_profile_availabilities';
  info: {
    displayName: 'Availability';
    icon: 'clock';
  };
  attributes: {
    freelanceAvailable: Schema.Attribute.Boolean;
    notAvailable: Schema.Attribute.Boolean;
    openToWork: Schema.Attribute.Boolean;
  };
}

export interface ProfileGithub extends Struct.ComponentSchema {
  collectionName: 'components_profile_githubs';
  info: {
    displayName: 'Github';
    icon: 'code';
  };
  attributes: {
    URL: Schema.Attribute.String;
  };
}

export interface ProfileLinkedIn extends Struct.ComponentSchema {
  collectionName: 'components_profile_linked_ins';
  info: {
    displayName: 'LinkedIn';
    icon: 'briefcase';
  };
  attributes: {
    URL: Schema.Attribute.String;
  };
}

export interface ProfileLogo extends Struct.ComponentSchema {
  collectionName: 'components_profile_logos';
  info: {
    displayName: 'Logo';
    icon: 'crown';
  };
  attributes: {
    Label: Schema.Attribute.String;
    Logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface ProjectBadge extends Struct.ComponentSchema {
  collectionName: 'components_project_badges';
  info: {
    displayName: 'Badge';
    icon: 'shield';
  };
  attributes: {
    Label: Schema.Attribute.String;
  };
}

export interface ProjectButton extends Struct.ComponentSchema {
  collectionName: 'components_project_buttons';
  info: {
    displayName: 'Button';
    icon: 'cursor';
  };
  attributes: {
    Label: Schema.Attribute.String;
    URL: Schema.Attribute.String;
  };
}

export interface ProjectTags extends Struct.ComponentSchema {
  collectionName: 'components_project_tags';
  info: {
    displayName: 'Tags';
    icon: 'priceTag';
  };
  attributes: {
    Collaboration: Schema.Attribute.Boolean;
    Collaborators: Schema.Attribute.String;
    Design: Schema.Attribute.Boolean;
    Development: Schema.Attribute.Boolean;
    Other: Schema.Attribute.Boolean;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'profile.availability': ProfileAvailability;
      'profile.github': ProfileGithub;
      'profile.linked-in': ProfileLinkedIn;
      'profile.logo': ProfileLogo;
      'project.badge': ProjectBadge;
      'project.button': ProjectButton;
      'project.tags': ProjectTags;
    }
  }
}
