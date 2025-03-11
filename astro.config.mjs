// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    shikiConfig: {
    themes: {
        light: 'one-light',
        dark: 'one-dark-pro',
      },
      langAlias: {
        'u-boot': 'bash',
      },
    },     
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeAutolinkHeadings, { behavior: "wrap" }]],
  },
});
