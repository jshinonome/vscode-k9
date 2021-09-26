/**
 * Copyright (c) 2020 Jo Shinonome
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Process } from './process';
import { ProcessManager } from './process-manager';

import path = require('path');

const qConnManager = ProcessManager.create();

export class ProcessTree extends TreeItem implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<Process | undefined> = new EventEmitter<Process | undefined>();
    readonly onDidChangeTreeData: Event<Process | undefined> = this._onDidChangeTreeData.event;
    _parent: TreeItem | null;
    _children: TreeItem[] = [];


    constructor(label: string, parent: TreeItem | null) {
        super(label, TreeItemCollapsibleState.Collapsed);
        this._parent = parent;
    }

    refresh(): void {
        if (this._parent) {
            return;
        }
        qConnManager.loadCfg();
        this._children = [];
        const itemMap = new Map<string, ProcessTree>();
        qConnManager.processPool.forEach(qconn => {
            if (qconn.tags.length) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                let parent: ProcessTree = this;
                let path = '';
                qconn.tags.split(',').forEach(
                    tag => {
                        path += tag;
                        const item = itemMap.get(path);
                        if (item) {
                            parent = item;
                        } else {
                            const newItem = new ProcessTree(tag, parent);
                            itemMap.set(path, newItem);
                            parent.appendChild(newItem);
                            parent = newItem;
                        }
                    }
                );
                itemMap.get(path)?.appendChild(qconn);
            } else {
                this._children.push(qconn);
            }
        });
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(e: TreeItem): TreeItem {
        return e;
    }

    getChildren(e?: TreeItem): Thenable<TreeItem[]> {
        if (e instanceof ProcessTree) {
            return Promise.resolve(e.getChildren());
        } else if (e instanceof Process) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(
                this._children
            );
        }
    }

    appendChild(item: TreeItem): void {
        this._children.push(item);
    }

    // @ts-ignore
    get iconPath(): { light: string, dark: string } {
        if (!this.label) {
            return {
                light: path.join(__filename, '../../assets/svg/item/tag.svg'),
                dark: path.join(__filename, '../../assets/svg/item/tag.svg')
            };
        } else if (['dev', 'development'].indexOf(this.label as string) >= 0) {
            return {
                light: path.join(__filename, '../../assets/svg/item/tag-dev.svg'),
                dark: path.join(__filename, '../../assets/svg/item/tag-dev.svg')
            };
        } else if (['uat', 'compute', 'cgm'].indexOf(this.label as string) >= 0) {
            return {
                light: path.join(__filename, '../../assets/svg/item/tag-uat.svg'),
                dark: path.join(__filename, '../../assets/svg/item/tag-uat.svg')
            };
        } else if (['prd', 'prod', 'product'].indexOf(this.label as string) >= 0) {
            return {
                light: path.join(__filename, '../../assets/svg/item/tag-prod.svg'),
                dark: path.join(__filename, '../../assets/svg/item/tag-prod.svg')
            };
        } else {
            return {
                light: path.join(__filename, '../../assets/svg/item/tag.svg'),
                dark: path.join(__filename, '../../assets/svg/item/tag.svg')
            };
        }

    }
}