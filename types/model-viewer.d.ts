import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  'camera-controls'?: boolean | '';
  'disable-zoom'?: boolean | '';
  'shadow-intensity'?: string;
  'environment-image'?: string;
  exposure?: string;
  'interaction-prompt'?: string;
  'camera-orbit'?: string;
  'field-of-view'?: string;
  className?: string;
  class?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

export {};
