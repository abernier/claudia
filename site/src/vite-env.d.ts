/// <reference types="vite/client" />

declare module "*.cast?url" {
  const src: string;
  export default src;
}

declare module "asciinema-player" {
  /** Minimal typing for the subset of the player API the site uses. */
  export function create(src: string, elem: HTMLElement, opts?: Record<string, unknown>): { dispose(): void };
}
