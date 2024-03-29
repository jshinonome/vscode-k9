# vscode extension for shakti-k9

[![](https://img.shields.io/visual-studio-marketplace/v/jshinonome.vscode-k9)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)
[![](https://vsmarketplacebadge.apphb.com/downloads/jshinonome.vscode-k9.svg?color=blue&style=flat)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)
[![](https://vsmarketplacebadge.apphb.com/installs/jshinonome.vscode-k9.svg?color=success&style=flat)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)

This extension provides [shakti-k9](https://shakti.sh/) language support of version `Li 2021.09.01 shakti 2.0`

## Features

-   [x] k syntaxes
-   [x] process list group by tags
-   [ ] process explorer
-   [x] query grid powered by [ag-grid-community](https://www.ag-grid.com/)
-   [ ] query virtualization powered by [perspective](https://perspective.finos.org/)
-   [x] language server powered by [tree-sitter](https://tree-sitter.github.io/tree-sitter/)
    -   rename symbol (F2)
    -   go to definition (F12)
    -   go to reference (Shift+F12)
    -   workspace symbol (Ctrl+T)
    -   document highlight
    -   document symbol (Ctrl+Shift+O)
    -   completion
    -   signature help
        -   identifiers defined in code

See the [change log](https://github.com/jshinonome/vscode-k9/blob/master/CHANGELOG.md).

## Configurations

-   To configure globally, type <kbd>ctrl</kbd>+<kbd>,</kbd> to open Settings and change the following values.
-   To configure for workspace, type <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>p</kbd>, call `Preferences: Open Workspace Settings` and change the following values.

| configuration                       | type   | default value                    | description                                |
| ----------------------------------- | ------ | -------------------------------- | ------------------------------------------ |
| k9-server.sourceFiles.globsPattern  | array  | `["**/src/**/*.k"]`              | source folder to be included               |
| k9-server.sourceFiles.ignorePattern | array  | `["**/build","**/node_modules"]` | folder to be excluded                      |
| k9-client.terminal.qBinary          | string | `k`                              | k executable file or full path             |
| k9-client.terminal.envPath          | string | ``                               | environment file relative or absolute path |

## Shortcuts

-   <kbd>ctrl</kbd>+<kbd>q</kbd>: query current line
-   <kbd>ctrl</kbd>+<kbd>r</kbd>: query selection
-   <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>q</kbd>: send current line to terminal
-   <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>r</kbd>: send selection to terminal
