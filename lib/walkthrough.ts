import type { Property } from './scoring';

export interface WalkthroughFrame {
  index: number;
  image: string;
  label: string;
  narration: string;
}

const DEFAULT_LABELS = [
  'You arrive at the gate',
  'Step through the front door',
  'Look around the living room',
  'Walk into the kitchen',
  'A bedroom',
  'Another room in the home',
];

export function buildWalkthrough(property: Property): WalkthroughFrame[] {
  const images = property.images?.length
    ? property.images
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];
  const labels =
    property.room_labels && property.room_labels.length === images.length
      ? property.room_labels
      : DEFAULT_LABELS;

  return images.map((image, index) => {
    const label = labels[index] || `Room ${index + 1}`;
    return {
      index,
      image,
      label,
      narration:
        index === 0
          ? `Imagine walking up to ${property.title} in ${property.neighborhood}.`
          : `Keep walking. ${label}.`,
    };
  });
}
