'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface FileTreeViewerProps {
  paths: string[];
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    isFolder: true,
    children: {},
  };

  for (const rawPath of paths) {
    const cleanPath = rawPath.replace(/^[/\\]+/, '');
    const parts = cleanPath.split(/[/\\]/);

    let current = root;
    let accumulated = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      accumulated = accumulated ? `${accumulated}/${part}` : part;
      const isFolder = i < parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: accumulated,
          isFolder,
          children: {},
        };
      }
      current = current.children[part];
    }
  }

  return root;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'rs':
    case 'go':
    case 'py':
    case 'c':
    case 'cpp':
    case 'sql':
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'md':
    case 'txt':
    case 'license':
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-muted shrink-0" />;
  }
}

interface TreeItemProps {
  node: TreeNode;
  depth?: number;
}

function TreeItem({ node, depth = 0 }: TreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.isFolder) {
    const childrenList = Object.values(node.children).sort((a, b) => {
      // Folders first, then files
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
      return a.isFolder ? -1 : 1;
    });

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className="w-full flex items-center gap-1.5 py-1 text-left text-xs font-mono text-fg/80 hover:text-white hover:bg-white/[0.04] rounded transition-colors group"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted group-hover:text-white shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-white shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-brand-red/90 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-muted shrink-0" />
          )}
          <span className="truncate">{node.name}/</span>
        </button>

        {isOpen && (
          <div>
            {childrenList.map((child) => (
              <TreeItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ paddingLeft: `${depth * 14 + 22}px` }}
      className="flex items-center gap-2 py-1 text-xs font-mono text-fg/75 hover:text-white rounded"
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
}

export default function FileTreeViewer({ paths }: FileTreeViewerProps) {
  const tree = useMemo(() => buildTree(paths || []), [paths]);
  const rootChildren = Object.values(tree.children).sort((a, b) => {
    if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
    return a.isFolder ? -1 : 1;
  });

  if (!paths || paths.length === 0) return null;

  return (
    <div className="rounded-card bg-surface border border-line p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-red" />
          <h3 className="font-sans font-semibold text-base text-white">
            What&apos;s inside
          </h3>
        </div>
        <span className="font-mono text-xs text-muted">
          {paths.length} {paths.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      <div
        data-lenis-prevent
        className="max-h-[360px] overflow-y-auto overflow-x-auto rounded-xl bg-black/40 border border-line/60 p-2.5 font-mono text-xs scrollbar-thin"
      >
        {rootChildren.map((node) => (
          <TreeItem key={node.path} node={node} depth={0} />
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted leading-tight">
        File names only. Complete source contents are delivered immediately after purchase or claim.
      </p>
    </div>
  );
}
