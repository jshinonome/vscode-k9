/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ColorThemeKind, ExtensionContext, StatusBarAlignment, StatusBarItem, window } from 'vscode';
import { ProcessManager } from './process-manager';

export class StatusBarManager {
    private connStatusBar: StatusBarItem;
    private queryStatusBar: StatusBarItem;
    private unlimitedQueryStatusBar: StatusBarItem;
    private queryModeStatusBar: StatusBarItem;
    private isLightTheme = window.activeColorTheme.kind === ColorThemeKind.Light;
    public static current: StatusBarManager | undefined;
    public static create(context: ExtensionContext): StatusBarManager {
        if (!this.current) {
            this.current = new StatusBarManager(context);
        }
        return this.current;
    }

    private constructor(context: ExtensionContext) {

        this.queryModeStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 94);
        context.subscriptions.push(this.queryModeStatusBar);
        this.queryModeStatusBar.color = this.isLightTheme ? '#E65100' : '#FFAB40';
        this.queryModeStatusBar.command = 'k9-client.switchMode';
        this.queryModeStatusBar.text = '<k9' + ProcessManager.queryMode;
        this.queryModeStatusBar.show();

        this.queryStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 93);
        this.queryStatusBar.text = '$(play-circle)';
        this.queryStatusBar.color = '#4CAF50';
        this.queryStatusBar.tooltip = 'Querying';
        context.subscriptions.push(this.queryStatusBar);
        this.unlimitedQueryStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 92);
        this.unlimitedQueryStatusBar.text = '$(flame)';
        this.unlimitedQueryStatusBar.color = '#F44336';
        this.unlimitedQueryStatusBar.tooltip = 'Unlimited Query';
        context.subscriptions.push(this.unlimitedQueryStatusBar);

        this.connStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 91);
        context.subscriptions.push(this.connStatusBar);
        this.connStatusBar.color = this.isLightTheme ? '#E65100' : '#FFAB40';
        this.connStatusBar.command = 'k9-client.connectEntry';
        this.connStatusBar.show();

    }


    public static updateConnStatus(label: string | undefined): void {
        const text = (label ?? 'no connection').replace(',', '-');
        this.current!.connStatusBar.text = text + ' >';
    }

    public static updateQueryModeStatus(): void {
        this.current!.queryModeStatusBar.text = '<k9 ' + ProcessManager.queryMode;
    }

    public static toggleQueryStatus(show: boolean): void {
        if (show) {
            this.current!.queryStatusBar.show();
        } else {
            this.current!.queryStatusBar.hide();
        }
    }

    public static updateUnlimitedQueryStatus(isLimited: boolean): void {
        if (isLimited) {
            this.current!.unlimitedQueryStatusBar.hide();
        } else {
            this.current!.unlimitedQueryStatusBar.show();
        }
    }
}