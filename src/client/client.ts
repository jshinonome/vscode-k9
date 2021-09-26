/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
    commands, env, ExtensionContext, IndentAction, languages, Range, TextDocument,
    TextEdit, Uri, window, workspace
} from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { AddServer } from './component/add-server';
import HistoryTreeItem from './items/history';
import { Process } from './modules/process';
import { ProcessManager } from './modules/process-manager';
import { ProcessTree } from './modules/process-tree';
import { StatusBarManager } from './modules/status-bar-manager';
import { runSourceFile, sendToCurrentTerm } from './modules/terminal';
import path = require('path');

export function activate(context: ExtensionContext): void {
    // extra language configurations
    languages.setLanguageConfiguration('k', {
        onEnterRules: [
            {
                // eslint-disable-next-line no-useless-escape
                beforeText: /^(?!\s+).*[\(\[{].*$/,
                afterText: /^[)}\]]/,
                action: {
                    indentAction: IndentAction.None,
                    appendText: '\n '
                }
            },
            {
                // eslint-disable-next-line no-useless-escape
                beforeText: /^\s[)}\]];?$/,
                action: {
                    indentAction: IndentAction.Outdent
                }
            },
            {
                // eslint-disable-next-line no-useless-escape
                beforeText: /^\/.*$/,
                action: {
                    indentAction: IndentAction.None,
                    appendText: '/ '
                }
            }
        ]
    });

    // append space to start [,(,{
    languages.registerDocumentFormattingEditProvider('k', {
        provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
            const textEdit: TextEdit[] = [];
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                if (line.isEmptyOrWhitespace) {
                    continue;
                }

                if (line.text.match('^[)\\]}]')) {
                    textEdit.push(TextEdit.insert(line.range.start, ' '));
                }
            }
            return textEdit;
        }
    });

    StatusBarManager.create(context);
    StatusBarManager.updateConnStatus(undefined);
    const processes = new ProcessTree('root', null);
    window.registerTreeDataProvider('k9-processes', processes);
    processes.refresh();
    const history = HistoryTreeItem.createHistoryTree();
    window.registerTreeDataProvider('k9-history', history);
    history.refresh();

    AddServer.setExtensionPath(context.extensionPath);

    // <-- configuration
    const queryMode = workspace.getConfiguration().get('k9-client.queryMode');
    ProcessManager.setQueryMode(queryMode as string);
    // -->

    commands.registerCommand(
        'k9-client.refreshEntry', () => processes.refresh());

    // q cfg input
    commands.registerCommand(
        'k9-client.addEntry',
        () => {
            AddServer.createOrShow();
        });

    commands.registerCommand(
        'k9-client.editEntry',
        (process: Process) => {
            AddServer.createOrShow();
            AddServer.update(process);
        });

    commands.registerCommand(
        'k9-client.deleteEntry',
        (process: Process) => {
            window.showInputBox(
                { prompt: `Confirm to Remove Server '${process.uniqLabel.replace(',', '-')}' (Y/n)` }
            ).then(value => {
                if (value === 'Y') {
                    ProcessManager.current?.removeCfg(process.uniqLabel);

                }
            });
        });

    commands.registerCommand(
        'k9-client.reactions',
        async () => {
            const option = await window.showQuickPick(
                ['1 - Raising an Issue', '2 - Writing a Review', '3 - Creating a Pull Request', '4 - Buying Me a Beer', '5 - Q & A'],
                { placeHolder: 'Contribute to vscode-q by' });
            switch (option?.[0]) {
                case '1':
                    env.openExternal(Uri.parse('https://github.com/jshinonome/vscode-k9/issues'));
                    break;
                case '2':
                    env.openExternal(Uri.parse('https://marketplace.visualstudio.com/items?itemName=jshinonome.vscode-k9&ssr=false#review-details'));
                    break;
                case '3':
                    env.openExternal(Uri.parse('https://github.com/jshinonome/vscode-k9/blob/master/CONTRIBUTING.md'));
                    break;
                case '4':
                    env.openExternal(Uri.parse('https://www.buymeacoffee.com/jshinonome'));
                    break;
                case '5':
                    env.openExternal(Uri.parse('https://github.com/jshinonome/vscode-k9/discussions'));
            }
        });

    commands.registerCommand(
        'k9-client.connectEntry',
        async () => {
            const option = await window.showQuickPick(
                ProcessManager.current?.processCfg.map(cfg => cfg.uniqLabel) ?? [],
                { placeHolder: 'Contribute to vscode-q by' });
            if (option)
                commands.executeCommand('k9-client.connect', option);
            return option;
        });

    commands.registerCommand(
        'k9-client.connect',
        uniqLabel => {
            ProcessManager.current?.connect(uniqLabel);
        });

    commands.registerCommand(
        'k9-client.tagEntry',
        async (process: Process) => {
            process.tags = await window.showInputBox({
                prompt: `Tags for '${process.label}' separate by ',' (e.g. 'dev,quant,tca')`
            }) ?? '';
            ProcessManager.current?.addCfg(process);
        });

    commands.registerCommand(
        'k9-client.switchMode',
        async () => {
            const mode = await window.showQuickPick(['Console', 'Grid', 'Virtualization'],
                { placeHolder: 'Please choose a query mode from the list below' });
            if (mode) {
                window.showInformationMessage(`Switch to Query ${mode} Mode`);
                ProcessManager.setQueryMode(mode);
                StatusBarManager.updateQueryModeStatus();
            }
        });

    commands.registerCommand(
        'k9-client.toggleLimitQuery',
        () => {
            ProcessManager.current?.toggleLimitQuery();
        });

    commands.registerCommand(
        'k9-client.abortQuery',
        () => {
            ProcessManager.current?.abortQuery();
        });

    commands.registerCommand(
        'k9-client.exportServers',
        () => {
            ProcessManager.current?.exportCfg();
        });

    commands.registerCommand(
        'k9-client.importServers',
        () => {
            ProcessManager.current?.importCfg();
        });


    context.subscriptions.push(
        commands.registerCommand('k9-client.terminal.sendCurrentLine', () => {
            if (window.activeTextEditor) {
                const n = window.activeTextEditor.selection.active.line;
                const query = window.activeTextEditor.document.lineAt(n).text;
                if (query) {
                    sendToCurrentTerm(query);
                }
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand('k9-client.terminal.sendSelection', () => {
            const query = window.activeTextEditor?.document.getText(
                new Range(window.activeTextEditor.selection.start, window.activeTextEditor.selection.end)
            );
            if (query) {
                sendToCurrentTerm(query.replace(/(\r\n|\n|\r)/gm, ''));
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand('k9-client.terminal.run', () => {
            const filepath = window.activeTextEditor?.document.fileName;
            if (filepath)
                runSourceFile(filepath);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('k9-client.queryCurrentLine', async () => {
            if (window.activeTextEditor) {
                const n = window.activeTextEditor.selection.active.line;
                const query = window.activeTextEditor.document.lineAt(n).text;
                if (query) {
                    try {
                        commands.getCommands().then(cmd => {
                            if (cmd.includes('not.exist')) {
                                commands.executeCommand('not.exist');
                            } else {
                                window.showErrorMessage('Command not.exist does not exist');
                            }
                        });
                    } catch (error) {
                        console.log(error);
                    }
                    ProcessManager.current?.sync(query);
                }
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand('k9-client.querySelection', () => {
            const query = window.activeTextEditor?.document.getText(
                new Range(window.activeTextEditor.selection.start, window.activeTextEditor.selection.end)
            );
            if (query) {
                ProcessManager.current?.sync(query);
            }
        })
    );

    // k9 language server
    const k9ls = path.join(context.extensionPath, 'dist', 'server.js');

    // The debug options for the server
    // runs the server in Node's Inspector mode for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6019'] };

    // If launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: k9ls, transport: TransportKind.ipc },
        debug: {
            module: k9ls,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'k' }],
        synchronize: {
            // Notify the server about k file changes
            fileEvents: workspace.createFileSystemWatcher('**/*.k')
        }
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'k9LangServer',
        'k9 Language Server',
        serverOptions,
        clientOptions
    );

    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(client.start());

    // context.subscriptions.push(
    //     commands.registerCommand('k-servers.sendServerCache', code => {
    //         client.sendNotification('$/analyze-server-cache', code);
    //     })
    // );

    client.onReady().then(() => {
        const cfg = workspace.getConfiguration('k9-server.sourceFiles');
        client.sendNotification('$/analyze-source-code', { globsPattern: cfg.get('globsPattern'), ignorePattern: cfg.get('ignorePattern') });
    });
}
