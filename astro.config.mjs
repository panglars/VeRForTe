// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";

import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeGithubAlert from "rehype-github-alert";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    compressHTML: true,
    site: "https://matrix.ruyisdk.org",

    integrations: [
        react(),
        sitemap({
            i18n: {
                defaultLocale: "en",
                locales: {
                    en: "en-US",
                    "zh-CN": "zh-CN",
                },
            },
        }),
    ],

    i18n: {
        locales: ["en", "zh-CN"],
        defaultLocale: "en",
    },

    vite: {
        plugins: [tailwindcss()],
    },

    markdown: {
        shikiConfig: {
            theme: "one-dark-pro",
            langAlias: {
                "u-boot": "log",
            },
        },
        processor: unified({
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
                [rehypeAutolinkHeadings, { behavior: "wrap" }],
                rehypeGithubAlert,
            ],
        }),
    },
});
