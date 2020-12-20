# vscode extension for shakti-k9

[![](https://img.shields.io/visual-studio-marketplace/v/jshinonome.vscode-k9)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)
[![](https://vsmarketplacebadge.apphb.com/downloads/jshinonome.vscode-k9.svg?color=blue&style=flat)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)
[![](https://vsmarketplacebadge.apphb.com/installs/jshinonome.vscode-k9.svg?color=success&style=flat)](https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9)

This extension provides [shakti-k9](https://shakti.sh/) language support.

## Features

-   [x] k syntaxes
-   [ ] server list group by tags
-   [ ] server explorer
-   [ ] query grid powered by [ag-grid-community](https://www.ag-grid.com/)
-   [ ] query virtualization powered by [perspective](https://perspective.finos.org/)
-   [ ] language server powered by [tree-sitter](https://tree-sitter.github.io/tree-sitter/)
    -   rename symbol (F2)
    -   go to definition (F12)
    -   go to reference (Shift+F12)
    -   workspace symbol (Ctrl+T)
    -   document highlight
    -   document symbol (Ctrl+Shift+O)
    -   completion
        -   identifiers defined in code
        -   identifiers defined on shakti process
        -   column names define on shakti process
    -   completion resolve
    -   signature help

See the [change log](https://github.com/jshinonome/vscode-k9/blob/master/CHANGELOG.md).

## Shortcuts

-   <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>enter</kbd>: send current line to active terminal
-   <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>e</kbd>: send selected line(s) to active terminal
