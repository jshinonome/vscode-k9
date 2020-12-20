/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
    commands, ExtensionContext,
    Range,
    window
} from 'vscode';
import { sendToCurrentTerm } from './modules/terminal';

export function activate(context: ExtensionContext): void {
    context.subscriptions.push(
        commands.registerCommand('k-term.sendCurrentLine', () => {
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
        commands.registerCommand('k-term.sendSelection', () => {
            const query = window.activeTextEditor?.document.getText(
                new Range(window.activeTextEditor.selection.start, window.activeTextEditor.selection.end)
            );
            if (query) {
                sendToCurrentTerm(query.replace(/(\r\n|\n|\r)/gm, ''));
            }
        })
    );
}
