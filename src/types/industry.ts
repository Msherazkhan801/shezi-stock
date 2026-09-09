export type IndustryType = 'pharmacy' | 'general_store' | 'restaurant';

export interface IndustryConfig {
  id: IndustryType;
  title: string;
  tagline: string;
  badge: string;
  iconName: string;
  accentColor: string;
  accentSecondary: string;
  gradient: [string, string];
  cardBg: string;
  posFeatures: {
    title: string;
    description: string;
    icon: string;
  }[];
  schemaHighlights: string[];
}
