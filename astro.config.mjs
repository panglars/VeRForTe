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

  i18n: {
    locales: ["en", "zh_CN"],
    defaultLocale: "en",
  },
  
  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    shikiConfig: {
    theme: 'one-dark-pro',
    langAlias: {
        'u-boot': 'log',
      },
    },     
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeAutolinkHeadings, { behavior: "wrap" }]],
  },
});
