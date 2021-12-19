/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import * as fs from 'fs';
import { KConnection } from 'jk9';
import { homedir } from 'os';
import { commands, Uri, window, workspace } from 'vscode';
import HistoryTreeItem from '../items/history';
import { QueryResult } from '../models/query-result';
import { Process } from './process';
import { StatusBarManager } from './status-bar-manager';
import { QueryConsole } from './query-console';
import { QueryGrid } from '../component/query-grid';
import { QueryView } from '../component/query-view';
import path = require('path');

const cfgDir = homedir() + '/.vscode/';
const cfgPath = cfgDir + 'k9-process-cfg.json';

export class ProcessManager {
    public static current: ProcessManager | undefined;
    processPool = new Map<string, Process>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processCfg: ProcessCfg[] = [];
    activeProcess: Process | undefined;
    isBusy = false;
    busyConn: Process | undefined = undefined;
    queryWrapper = '';
    isLimited = true;
    pollingId: NodeJS.Timer | undefined = undefined;
    public static consoleSize = workspace.getConfiguration().get('k9-client.output.consoleSize') as string;
    public static autoRefreshExplorer = workspace.getConfiguration().get('k9-client.expl.autoRefresh') as boolean;
    public static queryMode = 'Console';
    public static queryWrapper = '';
    public static consoleMode = true;

    public static create(): ProcessManager {
        if (!this.current) {
            this.current = new ProcessManager();
        }
        return this.current;
    }

    private constructor() {
        this.loadCfg();
        this.updateQueryWrapper();
    }

    // when switch a server or toggle query mode, update wrapper
    public updateQueryWrapper(): void {
        this.queryWrapper = this.isLimited ? '`qL' : '`qU';
    }

    public toggleLimitQuery(): void {
        this.isLimited = !this.isLimited;
        StatusBarManager.updateUnlimitedQueryStatus(this.isLimited);
        this.updateQueryWrapper();
    }

    public static setQueryMode(mode: string): void {
        ProcessManager.queryMode = mode;
        if (mode === 'Console') {
            ProcessManager.consoleMode = true;
            QueryGrid.currentPanel?.dispose();
            QueryView.currentPanel?.dispose();
        } else if (mode === 'Grid') {
            QueryView.currentPanel?.dispose();
            ProcessManager.consoleMode = false;
        } else if (mode === 'Virtualization') {
            QueryGrid.currentPanel?.dispose();
            ProcessManager.consoleMode = false;
        }
        ProcessManager.current?.updateQueryWrapper();
    }

    getProcess(uniqLabel: string): Process | undefined {
        return this.processPool.get(uniqLabel);
    }

    // query to run after connected to q server
    connect(uniqLabel: string, query = ''): void {
        try {
            const process = this.getProcess(uniqLabel);
            if (process) {
                const connection = process.connection;
                if (connection) {
                    this.activeProcess = process;
                    StatusBarManager.updateConnStatus(uniqLabel);
                    commands.executeCommand('k9-client.refreshEntry');
                    commands.executeCommand('q-explorer.refreshEntry');
                    this.updateQueryWrapper();
                    if (query) {
                        this.sync(query);
                    }
                } else {
                    process.auth().then(processCfg => {
                        const k = new KConnection(processCfg);
                        k.addListener('error', (err: Error) => {
                            if (err) window.showErrorMessage(err.message);
                        });
                        k.addListener('close', () => this.removeServer(uniqLabel));
                        k.connect(() => {
                            process.setConn(k);
                            process.loadWrappers();
                            this.activeProcess = process;
                            commands.executeCommand('k9-client.refreshEntry');
                            if (query) {
                                this.sync(query);
                            }
                        });
                    }).catch(reason => console.log(reason));
                }
            }
        } catch (error) {
            window.showErrorMessage(`Failed to connect to '${uniqLabel}', please check ${cfgPath}`);
        }
    }

    sync(query: string): void {
        if (this.isBusy) {
            window.showWarningMessage('Still executing last query');
        } else if (this.activeProcess) {
            if (query.slice(-1) === ';') {
                query = query.slice(0, -1);
            } else if (query[0] === '`') {
                // append space if query starts with back-tick, otherwise query will be treated as a symbol.
                query = query + ' ';
            }
            this.isBusy = true;
            this.busyConn = this.activeProcess;
            StatusBarManager.toggleQueryStatus(this.isBusy);
            const uniqLabel = this.activeProcess?.uniqLabel;
            const time = Date.now();
            const timestamp = new Date();
            // query wrapper is not supported on k9 side yet
            this.activeProcess?.connection?.sync(this.queryWrapper, query,
                (err: Error, res: any) => {
                    this.isBusy = false;
                    this.busyConn = undefined;
                    QueryConsole.createOrShow();
                    const duration = Date.now() - time;
                    if (err) {
                        QueryConsole.current?.appendError(['ERROR', err.message], duration, uniqLabel, query);
                        HistoryTreeItem.appendHistory(
                            { uniqLabel: uniqLabel, time: timestamp, duration: duration, query: query, errorMsg: err.message });
                    }
                    if (res) {
                        if (ProcessManager.consoleMode) {
                            QueryConsole.current?.append(JSON.stringify(res.r), duration, uniqLabel, query);
                            HistoryTreeItem.appendHistory({ uniqLabel: uniqLabel, time: timestamp, duration: duration, query: query, errorMsg: '' });
                        } else {
                            if (res.t) {
                                this.update({
                                    type: 'json',
                                    data: res.r,
                                    meta: res.m,
                                    keys: res.k,
                                    query: query,
                                });
                                QueryConsole.current?.append(`> ${res.r[Object.keys(res.r)[0]].length} row(s) returned`, duration, uniqLabel, query);
                            }
                            else {
                                QueryConsole.current?.append(res.r, duration, uniqLabel, query);
                            }
                            HistoryTreeItem.appendHistory({ uniqLabel: uniqLabel, time: timestamp, duration: duration, query: query, errorMsg: '' });
                        }
                    }
                    StatusBarManager.toggleQueryStatus(this.isBusy);
                    if (ProcessManager.autoRefreshExplorer) {
                        commands.executeCommand('q-explorer.refreshEntry');
                    }
                }
            );
        } else {
            commands.executeCommand('k9-client.connectEntry').then(
                uniqLabel => this.connect(uniqLabel as string, query)
            );
        }
    }

    static polling(query: string): void {
        const current = ProcessManager.current;
        if (current && !current.isBusy && current.activeProcess) {
            if (query.slice(-1) === ';') {
                query = query.slice(0, -1);
            } else if (query[0] === '`') {
                // append space if query starts with back-tick, otherwise query will be treated as a symbol.
                query = query + ' ';
            }
            current.isBusy = true;
            current.busyConn = current.activeProcess;
            StatusBarManager.toggleQueryStatus(current.isBusy);
            const uniqLabel = current.activeProcess?.uniqLabel;
            const time = Date.now();
            current.activeProcess?.connection?.sync(current.queryWrapper, query,
                (err: Error, res: any) => {
                    current.isBusy = false;
                    current.busyConn = undefined;
                    QueryConsole.createOrShow();
                    const duration = Date.now() - time;
                    if (err) {
                        QueryConsole.current?.appendError(['ERROR', err.message], duration, uniqLabel, query);
                        current.stopPolling();
                    }
                    if (res) {
                        if (typeof res.r === 'string' && res.r.startsWith('ERROR')) {
                            const msg: string[] = res.r.split('\n');
                            QueryConsole.current?.appendError(msg, duration, uniqLabel, query);
                            current.stopPolling();
                        } else {
                            if (res.t) {
                                const meta = {
                                    c: Object.keys(res.m),
                                    t: Object.values(res.m)
                                };
                                current.update({
                                    type: 'json',
                                    data: res.r,
                                    meta: meta,
                                    keys: res.k,
                                });
                                QueryConsole.current?.append(`> ${res.r[Object.keys(res.r)[0]].length} row(s) returned`, duration, uniqLabel, query);
                            }
                            else {
                                QueryConsole.current?.append(res.r, duration, uniqLabel, query);
                            }
                        }
                    }
                    StatusBarManager.toggleQueryStatus(current.isBusy);
                }
            );
        }
    }

    startPolling(interval: number, query: string): void {
        if (this.pollingId) {
            this.stopPolling();
        }
        if (interval && query)
            this.pollingId = setInterval(ProcessManager.polling, interval, query);
    }

    stopPolling(): void {
        if (this.pollingId) {
            clearInterval(this.pollingId);
            this.pollingId = undefined;
        }
    }

    update(result: QueryResult): void {
        if (ProcessManager.queryMode === 'Grid') {
            QueryGrid.createOrShow();
            QueryGrid.update(result);
        } else {
            QueryView.createOrShow();
            QueryView.update(result);
        }
    }

    loadCfg(): void {
        // read the q server configuration file from home dir
        if (fs.existsSync(cfgPath)) {
            this.processCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            this.processCfg = this.processCfg.map(qcfg => {
                qcfg.uniqLabel = `${qcfg.tags},${qcfg.label}`;
                qcfg.useCustomizedAuth = qcfg.useCustomizedAuth === true ? true : false;
                return qcfg;
            });
            // reserver current conn
            const currentQconnPool = new Map(this.processPool);
            this.processPool.clear();
            this.processCfg.forEach((qcfg: ProcessCfg) => {
                if (!this.processPool.get(qcfg.uniqLabel)) {
                    this.processPool.set(qcfg.uniqLabel, new Process(qcfg, currentQconnPool.get(qcfg.uniqLabel)?.connection));
                }
            });
        } else {
            if (!fs.existsSync(cfgDir)) {
                fs.mkdirSync(cfgDir);
            }
            fs.writeFileSync(cfgPath, '[]', 'utf8');
        }
    }

    async importCfg(): Promise<void> {
        if (!workspace.workspaceFolders) {
            window.showErrorMessage('No opened workspace folder');
            return;
        }
        const workspaceFolder = workspace.workspaceFolders[0].uri;
        const paths = await window.showOpenDialog({
            defaultUri: workspaceFolder,
            canSelectMany: false
        });
        let path = '';
        if (paths && paths.length > 0) {
            path = paths[0].fsPath;
        }
        if (fs.existsSync(path)) {
            try {
                const qCfg = JSON.parse(fs.readFileSync(path, 'utf8'));
                this.processCfg = qCfg.map((qcfg: ProcessCfg) => {
                    if (qcfg.port && qcfg.label) {
                        if (!parseInt(qcfg.port as unknown as string)) {
                            window.showErrorMessage(`Please input an integer for port of '${qcfg.label}'`);
                        }
                        return {
                            host: qcfg.host,
                            port: qcfg.port,
                            user: qcfg.user ?? '',
                            password: qcfg.password ?? '',
                            socketNoDelay: qcfg.socketNoDelay ?? false,
                            socketTimeout: qcfg.socketTimeout ?? 0,
                            label: qcfg.label as string,
                            tags: qcfg.tags ?? '',
                            uniqLabel: `${qcfg.tags},${qcfg.label}`,
                            useCustomizedAuth: `${qcfg.useCustomizedAuth ?? false}`
                        };
                    } else {
                        throw new Error('Please make sure to include port and label');
                    }
                });
                this.dumpCfg();
                commands.executeCommand('k9-client.refreshEntry');
            } catch (error) {
                const { message } = error as Error;
                window.showErrorMessage(message);
            }
        }
    }

    async exportCfg(): Promise<void> {
        if (fs.existsSync(cfgPath)) {
            const cfg = fs.readFileSync(cfgPath, 'utf8');
            if (!workspace.workspaceFolders) {
                window.showErrorMessage('No opened workspace folder');
                return;
            }
            const workspaceFolder = workspace.workspaceFolders[0].uri.fsPath;
            const filePath = path.join(workspaceFolder, 'q-server-cfg.json');
            const fileUri = await window.showSaveDialog({
                defaultUri: Uri.parse(filePath).with({ scheme: 'file' })
            });
            if (fileUri) {
                fs.writeFile(fileUri.fsPath, cfg, err => window.showErrorMessage(err?.message ?? ''));
            }
        }
    }

    abortQuery(): void {
        this.busyConn?.connection?.close();
        this.isBusy = false;
        this.busyConn = undefined;
        StatusBarManager.toggleQueryStatus(this.isBusy);
    }

    addCfg(qcfg: ProcessCfg): void {
        const uniqLabel = qcfg.uniqLabel;
        this.processCfg = this.processCfg.filter(qcfg => qcfg.uniqLabel !== uniqLabel);
        this.processCfg.push(qcfg);
        this.processCfg.sort((q1, q2) => q1.uniqLabel.localeCompare(q2.uniqLabel));
        this.dumpCfg();
        commands.executeCommand('k9-client.refreshEntry');
    }

    removeCfg(uniqLabel: string): void {
        this.processCfg = this.processCfg.filter(qcfg => qcfg.uniqLabel !== uniqLabel);
        this.dumpCfg();
        commands.executeCommand('k9-client.refreshEntry');
    }

    dumpCfg(): void {
        fs.writeFileSync(cfgPath, JSON.stringify(this.processCfg.map(qcfg => {
            return {
                host: qcfg.host,
                port: qcfg.port,
                user: qcfg.user,
                password: qcfg.password,
                socketNoDelay: qcfg.socketNoDelay,
                socketTimeout: qcfg.socketTimeout,
                label: qcfg.label,
                tags: qcfg.tags,
                uniqLabel: `${qcfg.tags},${qcfg.label}`,
                useCustomizedAuth: qcfg.useCustomizedAuth === true
            };
        }), null, 4), 'utf8');
    }

    removeServer(uniqLabel: string): void {
        const server = this.getProcess(uniqLabel);
        server?.setConn(undefined);
        if (this.activeProcess?.uniqLabel === uniqLabel) {
            this.activeProcess = undefined;
            StatusBarManager.updateConnStatus(undefined);
        }
        commands.executeCommand('k9-client.refreshEntry');
        window.showWarningMessage(`Lost connection to ${uniqLabel} `);
    }
}

export type ProcessCfg = {
    host: string;
    port: number;
    user: string;
    password: string;
    socketNoDelay: boolean;
    socketTimeout: number;
    label: string;
    tags: string;
    uniqLabel: string;
    useCustomizedAuth: boolean;
}
