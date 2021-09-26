/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { KConnection } from 'jk9';
import { Command, extensions, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import { ProcessCfg as processCfg, ProcessManager } from './process-manager';
import path = require('path');

const customizedAuthExtension = extensions.getExtension('jshinonome.vscode-q-auth');
let customizedAuth = (qcfg: processCfg) => new Promise(resolve => resolve(qcfg));

customizedAuthExtension?.activate().then(_ => {
    customizedAuth = customizedAuthExtension.exports.auth;
    Process.customizedAuthInstalled = true;
});

export class Process extends TreeItem {
    label: string;
    host: string;
    port: number;
    user: string;
    password: string;
    socketNoDelay: boolean;
    socketTimeout: number;
    connection?: KConnection;
    command?: Command;
    flipTables = false;
    // kdb+ version
    version = 3.0;
    tags: string;
    uniqLabel: string;
    useCustomizedAuth: boolean;
    public static customizedAuthInstalled = false;

    constructor(cfg: processCfg, conn: KConnection | undefined = undefined) {
        super(cfg['label'], TreeItemCollapsibleState.None);
        this.host = ('host' in cfg) ? cfg['host'] : 'localhost';
        if (~'port' in cfg) {
            throw new Error('No port found in cfg file');
        }
        this.label = cfg['label'];
        this.port = cfg['port'];
        this.user = ('user' in cfg) ? cfg['user'] : '';
        this.password = ('password' in cfg) ? cfg['password'] : '';
        this.socketNoDelay = ('socketNoDelay' in cfg) ? cfg['socketNoDelay'] : false;
        this.socketTimeout = ('socketTimeout' in cfg) ? cfg['socketTimeout'] : 0;
        this.connection = conn;
        this.tags = cfg.tags ?? '';
        this.uniqLabel = `${cfg.tags},${cfg.label}`;
        this.command = {
            command: 'k9-client.connect',
            title: 'connect to q server',
            arguments: [this.uniqLabel]
        };
        this.useCustomizedAuth = 'useCustomizedAuth' in cfg ? cfg['useCustomizedAuth'] : false;
        this.tooltip = `${this.host}:${this.port}:${this.user} - t/o:${this.socketTimeout}(ms)`;
    }

    setConn(conn: KConnection | undefined): void {
        this.connection = conn;
    }

    auth(): Promise<processCfg> {
        if (this.useCustomizedAuth && Process.customizedAuthInstalled) {
            if (customizedAuthExtension && customizedAuthExtension.isActive) {
                return customizedAuth(this) as Promise<processCfg>;
            } else {
                window.showWarningMessage('Customized Auth Plug-in(jshinonome.vscode-k9-auth) is not found or not activated yet');
                return Promise.reject(new Error('Customized Auth Plug-in(jshinonome.vscode-k9-auth) Not Found'));
            }
        } else {
            return Promise.resolve(this);
        }
    }

    // @ts-ignore
    get iconPath(): { light: string, dark: string } {
        if (ProcessManager.current?.activeServer?.uniqLabel === this.uniqLabel) {
            return {
                light: path.join(__filename, '../../assets/svg/light/cpu-active.svg'),
                dark: path.join(__filename, '../../assets/svg/dark/cpu-active.svg')
            };
        } else if (this.connection) {
            return {
                light: path.join(__filename, '../../assets/svg/light/cpu-connected.svg'),
                dark: path.join(__filename, '../../assets/svg/dark/cpu-connected.svg')
            };
        } else {
            return {
                light: path.join(__filename, '../../assets/svg/light/cpu.svg'),
                dark: path.join(__filename, '../../assets/svg/dark/cpu.svg')
            };
        }
    }

    contextValue = 'k9-process';
}