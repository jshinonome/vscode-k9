/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import * as fs from 'fs';
import {
    CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity,
    DidChangeWatchedFilesParams, DocumentHighlight, DocumentSymbolParams, FileChangeType, Hover,
    InitializeParams, Location, PrepareRenameParams, Range,
    ReferenceParams, RenameParams, ServerCapabilities, SignatureHelp,
    SignatureHelpParams, SymbolInformation, SymbolKind, TextDocumentPositionParams, TextDocuments,
    TextDocumentSyncKind, TextEdit, WorkspaceEdit, WorkspaceSymbolParams, SemanticTokensParams, SemanticTokens
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import Analyzer, { word } from './modules/analyser';
import getBuildInFsRef from './util/build-in-fs';
import { initializeParser } from './util/parser';

export default class LangServer {
    connection: Connection;
    // Create a simple text document manager. The text document manager
    // supports full document sync only
    documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

    buildInFsRef: CompletionItem[] = [];

    private analyzer: Analyzer;

    private constructor(connection: Connection, analyzer: Analyzer) {
        this.connection = connection;
        this.analyzer = analyzer;
        this.buildInFsRef = getBuildInFsRef();
        // Make the text document manager listen on the connection
        // for open, change and close text document events
        this.documents.listen(this.connection);

        this.documents.onDidChangeContent(this.onDidChangeContent.bind(this));
        this.connection.onHover(this.onHover.bind(this));
        this.connection.onDefinition(this.onDefinition.bind(this));
        this.connection.onWorkspaceSymbol(this.onWorkspaceSymbol.bind(this));
        this.connection.onDidChangeWatchedFiles(this.onDidChangeWatchedFiles.bind(this));
        this.connection.onDocumentHighlight(this.onDocumentHighlight.bind(this));
        this.connection.onReferences(this.onReferences.bind(this));
        this.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));
        this.connection.onCompletion(this.onCompletion.bind(this));
        this.connection.onCompletionResolve(this.onCompletionResolve.bind(this));
        this.connection.onPrepareRename(this.onPrepareRename.bind(this));
        this.connection.onRenameRequest(this.onRenameRequest.bind(this));
        this.connection.onSignatureHelp(this.onSignatureHelp.bind(this));
        this.connection.onNotification('$/analyze-server-cache', (code => this.analyzer.analyzeServerCache(code)));
        this.connection.onNotification('$/analyze-source-code', (cfg => this.analyzer.analyzeWorkspace(cfg)));
        this.connection.languages.semanticTokens.on(this.onSemanticsToken.bind(this));
    }

    public static async initialize(
        connection: Connection,
        { workspaceFolders }: InitializeParams,
    ): Promise<LangServer> {
        const workspaceFolder = workspaceFolders ? workspaceFolders[0].uri : '';
        connection.console.info(`Initializing Lang Server at ${workspaceFolder}`);
        console.info(`Initializing Lang Server at ${workspaceFolder}`);
        const parser = await initializeParser();
        return Analyzer.fromRoot(connection, workspaceFolder, parser).then(
            analyzer => { return new LangServer(connection, analyzer); }
        );
    }


    public capabilities(): ServerCapabilities {
        return {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            documentHighlightProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            referencesProvider: true,
            renameProvider: {
                prepareProvider: true
            },
            signatureHelpProvider: {
                triggerCharacters: ['['],
                retriggerCharacters: [';']
            },
            semanticTokensProvider: {
                documentSelector: null,
                legend: {
                    tokenTypes: ['variable', 'parameter', 'type', 'class'],
                    tokenModifiers: []
                },
                full: true,
            }
        };
    }

    // todo - when add more rules, extract to a package
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private onDidChangeContent(change: any) {
        this.analyzer.analyzeDoc(change.document.uri, change.document);
        const diagnostics = this.validateTextDocument(change.document);
        // Send the computed diagnostics to VSCode.
        this.connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    }

    private async onDidChangeWatchedFiles(change: DidChangeWatchedFilesParams) {
        this.connection.console.info('Received file change event(s)');
        const changedFiles: string[] = [];
        change.changes.forEach(event => {
            switch (event.type) {
                case FileChangeType.Deleted:
                    this.connection.console.info(`Removing ${event.uri} from cache`);
                    this.analyzer.remove(event.uri);
                    break;
                default:
                    changedFiles.push(event.uri);
            }
        });
        changedFiles.forEach(file => {
            const filepath = URI.parse(file).path;
            if (!Analyzer.matchFile(filepath))
                return;
            try {
                this.analyzer.analyzeDoc(file, TextDocument.create(file, 'q', 1, fs.readFileSync(filepath, 'utf8')));
            } catch (error) {
                this.connection.console.warn(`Cannot analyze ${file}`);
            }
        });
    }

    private onCompletion(params: TextDocumentPositionParams): CompletionItem[] {
        const word = this.getWordAtPoint({
            ...params,
            position: {
                line: params.position.line,
                // Go one character back to get completion on the current word
                character: Math.max(params.position.character - 1, 0),
            },
        });

        let symbols: string[] = [];
        let localId: CompletionItem[] = [];
        let globalId: CompletionItem[] = [];
        let completionItem: CompletionItem[] = [];
        // console.log(word?.text)

        if (word?.text.startsWith('.')) {
            completionItem = this.buildInFsRef.filter(item => item.label.startsWith('.'));
            globalId = this.analyzer.getServerIds().concat(
                this.analyzer.getAllSymbols()
                    .filter(sym => sym.name.startsWith('.'))
                    .map(sym => {
                        return { label: sym.name, kind: sym.kind === SymbolKind.Function ? CompletionItemKind.Method : CompletionItemKind.Variable };
                    }));
            const flags = new Map<string, boolean>();
            globalId.forEach(item => {
                if (!flags.get(item.label)) {
                    completionItem.push(item);
                    flags.set(item.label, true);
                }
            });
        } else if (word?.text.startsWith('`')) {
            symbols = this.analyzer.getSyms(params.textDocument.uri);
            new Set(symbols).forEach(symbol => {
                completionItem.push({ label: symbol, kind: CompletionItemKind.Enum });
            });
        } else {
            completionItem = this.buildInFsRef.filter(item => !item.label.startsWith('.'));
            localId = this.analyzer.getServerIds().filter(id => !id.label.startsWith('.')).concat(
                this.analyzer.getLocalIds(params.textDocument.uri, word?.containerName ?? '')
                    .map(sym => {
                        return { label: sym.name, kind: sym.kind === SymbolKind.Function ? CompletionItemKind.Method : CompletionItemKind.Variable };
                    }));
            const flags = new Map<string, boolean>();
            localId.forEach(item => {
                if (!flags.get(item.label)) {
                    completionItem.push(item);
                    flags.set(item.label, true);
                }
            });
        }
        // console.log(completionItem)s
        return completionItem;
    }

    private async onCompletionResolve(
        item: CompletionItem,
    ): Promise<CompletionItem> {
        return item;
    }


    private onDefinition(params: TextDocumentPositionParams): Location[] {
        const word = this.getWordAtPoint(params);
        // this.logRequest('onDefinition', params, word);
        if (!word) {
            return [];
        }
        return this.analyzer.findDefinition(word, params.textDocument.uri);
    }

    private onWorkspaceSymbol(params: WorkspaceSymbolParams): SymbolInformation[] {
        return this.analyzer.search(params.query);
    }

    private onDocumentHighlight(
        params: TextDocumentPositionParams,
    ): DocumentHighlight[] | null {
        const word = this.getWordAtPoint(params);
        // this.logRequest('onDocumentHighlight', params, word)
        if (!word) {
            return [];
        }
        return this.analyzer.findSynNodeLocations(params.textDocument.uri, word)
            .map(syn => { return { range: syn.range }; });
    }

    private onReferences(params: ReferenceParams): Location[] | null {
        const word = this.getWordAtPoint(params);
        // this.logRequest('onReferences', params, word)
        if (!word) {
            return null;
        }
        return this.analyzer.findReferences(word, params.textDocument.uri);
    }

    // todo: limit to global and null container
    private onDocumentSymbol(params: DocumentSymbolParams): SymbolInformation[] {
        // this.connection.console.log(`onDocumentSymbol`)
        return this.analyzer.findSymbolsForFile(params.textDocument.uri);
    }

    private onPrepareRename(params: PrepareRenameParams): Range | null {
        const word = this.getWordAtPoint(params);
        if (word?.type === 'local_identifier' || word?.type === 'global_identifier') {
            return word.range;
        }
        return null;
    }

    private onRenameRequest(params: RenameParams): WorkspaceEdit | null | undefined {
        const word = this.getWordAtPoint(params);
        const changes: { [uri: string]: TextEdit[] } = {};
        if (word) {
            const locations = this.analyzer.findReferences(word, params.textDocument.uri);
            locations.map(location => {
                if (!changes[location.uri])
                    changes[location.uri] = [];
                changes[location.uri]
                    .push(TextEdit.replace(location.range, params.newName));
            });
        }
        if (changes)
            return { changes: changes };
    }

    private onSignatureHelp(params: SignatureHelpParams): SignatureHelp | undefined {
        // it is call and get its parent text
        return this.getSigHelpAtPoint(params);
    }

    private onSemanticsToken(params: SemanticTokensParams): SemanticTokens {
        // ['variable', 'parameter', 'type', 'class']
        const document = params.textDocument;
        return this.analyzer.getSemanticTokens(document.uri);
    }

    private validateTextDocument(textDocument: TextDocument): Diagnostic[] {
        const text = textDocument.getText();
        const pattern = /^[}\])]/gm;
        let m: RegExpExecArray | null;

        const diagnostics: Diagnostic[] = [];
        while ((m = pattern.exec(text)) !== null) {
            const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Error,
                range: {
                    start: textDocument.positionAt(m.index),
                    end: textDocument.positionAt(m.index + m[0].length)
                },
                message: `require a space before ${m[0]}`,
                source: 'q-lang-server'
            };
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: 'Multiline expressions'
                }
            ];
            diagnostics.push(diagnostic);
        }
        return diagnostics;
    }

    private async onHover(params: TextDocumentPositionParams): Promise<Hover | null> {
        const word = this.getWordAtPoint(params);
        // const currentUri = params.textDocument.uri;

        // this.logRequest('onHover', params, word)

        if (!word) {
            return null;
        }

        const ref = this.buildInFsRef.filter(item => item.label === word.text)[0];

        if (ref) {
            const content = {
                language: 'q',
                value: '/ ' + ref.detail + '\n' + ref.documentation as string
            };
            return { contents: content };
        }

        // let symbols: SymbolInformation[] = [];
        // symbols = this.analyzer.findSymbolsForFile(currentUri);
        // symbols = symbols.filter(
        //     sym =>
        //         sym.containerName === word.containerName && sym.location.range.start.line !== params.position.line)
        // if (word.containerName==='') {
        //     symbols.concat(
        //         this.analyzer.findSymbolsMatchingWord(true, word.text)
        //         .filter(sym=>sym.location.range.start.line!==params.position.line)
        //         );
        // }

        // if (symbols.length === 1) {
        //     return { contents: symbols[0] }
        // }

        return null;
    }

    private getWordAtPoint(
        params: ReferenceParams | TextDocumentPositionParams,
    ): word | null {
        return this.analyzer.wordAtPoint(
            params.textDocument.uri,
            params.position.line,
            params.position.character,
        );
    }

    private getSigHelpAtPoint(
        params: ReferenceParams | TextDocumentPositionParams,
    ): SignatureHelp | undefined {
        const node = this.analyzer.getNodeAtPoint(
            params.textDocument.uri,
            params.position.line,
            params.position.character,
        );
        if (node) {
            const callNode = this.analyzer.getCallNode(node);
            const sigHelp = this.analyzer.getSigHelp(callNode?.firstNamedChild?.text ?? '');
            if (callNode && sigHelp && callNode.firstNamedChild) {
                let child = callNode.firstNamedChild;
                let index = -1;
                while (child.nextNamedSibling !== null && node.startIndex > child.endIndex) {
                    index += 1;
                    child = child.nextNamedSibling;
                }
                sigHelp.activeParameter = index;
                return sigHelp;
            }

        }
        return undefined;
    }

    private logRequest(
        request: string,
        params: ReferenceParams | TextDocumentPositionParams,
        word?: word | null
    ) {
        const wordLog = word ? JSON.stringify(word) : 'null';
        this.connection.console.info(
            `${request} ${params.position.line}:${params.position.character} word=${wordLog}`,
        );
    }
}