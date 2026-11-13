# Support Matrix Frontend

RISC-V Board and OS Support Matrix Website

## Develop

Requires Node.js >=22.23.4 and pnpm 10.12.4 (see `packageManager`).

```bash
git clone git@github.com:QA-Team-lo/support-matrix-frontend.git 

cd ./support-matrix-frontend

git submodule update --init

pnpm install --frozen-lockfile

pnpm run dev
```


## Components

Directory: `src/components/`

<!-- TODO: add components description -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

<!-- TODO: contributions guide (reports/code/system information/board information) -->

## License

Apache License 2.0

## Acknowledgments

- [PLCT Lab](https://plctlab.org/en/)
- [ruyisdk/support-matrix](https://github.com/ruyisdk/support-matrix)

## Dependency upgrades

Run `pnpm check`, `pnpm build`, and `pnpm test:build` after updating dependencies. Use `pnpm preview`
to verify report sorting/filtering, date ranges, language navigation and theme persistence.

The project uses Astro 7 with the explicit unified Markdown processor to preserve
remark/rehype plugins, TanStack Table 9, Jotai 3 and React Day Picker 10.
TypeScript stays on 6.x because the current Astro language service requires `<7`.
Upgrade TypeScript together with compatible Astro checking/editor tools.

For major updates, migrate one dependency group at a time and commit its source
changes together with `package.json` and `pnpm-lock.yaml`.
