/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        ".markdown-alert": {
                            "margin-bottom": "1rem",
                            "font-size": "1rem",
                        },
                        ".markdown-alert-title": {
                            display: "flex",
                            "align-items": "center",
                            "margin-bottom": "0.25rem",
                        },
                        ".markdown-alert-title svg": {
                            display: "none",
                        },

                        ".markdown-alert-note": {
                            "background-color": "rgb(239 246 255)",
                            color: "rgb(30 64 175)",
                        },
                        ".markdown-alert-note .markdown-alert-title": {
                            color: "rgb(30 64 175)",
                        },
                        ".dark .markdown-alert-note": {
                            "background-color": "rgb(31 41 55)",
                            color: "rgb(96 165 250)",
                        },
                        ".dark .markdown-alert-note .markdown-alert-title": {
                            color: "rgb(96 165 250)",
                        },

                        ".markdown-alert-important": {
                            "background-color": "rgb(254 242 242)",
                            color: "rgb(153 27 27)",
                        },
                        ".markdown-alert-important .markdown-alert-title": {
                            color: "rgb(153 27 27)",
                        },
                        ".dark .markdown-alert-important": {
                            "background-color": "rgb(31 41 55)",
                            color: "rgb(248 113 113)",
                        },
                        ".dark .markdown-alert-important .markdown-alert-title":
                            {
                                color: "rgb(248 113 113)",
                            },

                        ".markdown-alert-tip": {
                            "background-color": "rgb(240 253 244)",
                            color: "rgb(22 101 52)",
                        },
                        ".markdown-alert-tip .markdown-alert-title": {
                            color: "rgb(22 101 52)",
                        },
                        ".dark .markdown-alert-tip": {
                            "background-color": "rgb(31 41 55)",
                            color: "rgb(74 222 128)",
                        },
                        ".dark .markdown-alert-tip .markdown-alert-title": {
                            color: "rgb(74 222 128)",
                        },

                        ".markdown-alert-warning, .markdown-alert-caution": {
                            "background-color": "rgb(254 252 232)",
                            color: "rgb(133 77 14)",
                        },
                        ".markdown-alert-warning .markdown-alert-title, .markdown-alert-caution .markdown-alert-title":
                            {
                                color: "rgb(133 77 14)",
                            },
                        ".dark .markdown-alert-warning, .dark .markdown-alert-caution":
                            {
                                "background-color": "rgb(31 41 55)",
                                color: "rgb(253 224 71)",
                            },
                        ".dark .markdown-alert-warning .markdown-alert-title, .dark .markdown-alert-caution .markdown-alert-title":
                            {
                                color: "rgb(253 224 71)",
                            },
                    },
                },
            },
        },
    },
};
