import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Tokens do theme.css: sem isso o twMerge trata text-body-sm como cor e remove text-primary-foreground
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'caption'],
      tracking: ['eyebrow'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
