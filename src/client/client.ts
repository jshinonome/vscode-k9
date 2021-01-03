/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
    commands, ExtensionContext,
    Range,
    window,
    workspace
} from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { runSourceFile, sendToCurrentTerm } from './modules/terminal';
import path = require('path');

export function activate(context: ExtensionContext): void {
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
