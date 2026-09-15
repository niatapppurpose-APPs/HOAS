import { useState, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, Building,
  Home, Users, Search, Layers
} from 'lucide-react';

function TreeNode({
  node,
  level = 0,
  expandedIds,
  onToggle,
  selectedId,
  onSelect,
}) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const IconComp =
    node.icon || (node.type === 'hostel' ? Building : node.type === 'room' ? Home : node.type === 'student' ? Users : isExpanded ? FolderOpen : Folder);

  return (
    <div className="select-none">
      <div
        onClick={() => {
          if (hasChildren) onToggle(node.id);
          if (onSelect) onSelect(node);
        }}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition text-xs font-medium ${
          isSelected
            ? 'bg-indigo-600 text-white font-bold'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
        style={{ paddingLeft: `${level * 16 + 10}px` }}
      >
        {hasChildren ? (
          <span className="p-0.5 text-slate-400 hover:text-white">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-3.5" />
        )}

        <IconComp className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />

        <span className="truncate flex-1">{node.name || node.label}</span>

        {node.badge && (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-400">
            {node.badge}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute left-[17px] top-0 bottom-2 w-px bg-white/10"
            style={{ left: `${level * 16 + 17}px` }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({
  data = [],
  selectedId,
  onSelect,
  title = 'Hostel & Room Hierarchy',
  className = '',
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleNode = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set();
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children) traverse(n.children);
      });
    };
    traverse(data);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filtered tree nodes
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    const filterNodes = (nodes) => {
      return nodes
        .map((n) => {
          const matchSelf = (n.name || n.label || '').toLowerCase().includes(q);
          const filteredChildren = n.children ? filterNodes(n.children) : [];
          if (matchSelf || filteredChildren.length > 0) {
            return { ...n, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean);
    };

    return filterNodes(data);
  }, [data, searchQuery]);

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 shadow-xl backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-modal, #0f172a)',
        borderColor: 'var(--border-primary, rgba(255,255,255,0.1))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={expandAll}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition font-medium"
          >
            Expand all
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition font-medium"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-xs"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter tree nodes..."
          className="w-full bg-transparent outline-none placeholder:text-slate-500"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Tree list */}
      <div className="space-y-0.5 max-h-[380px] overflow-y-auto no-scrollbar">
        {filteredData.length > 0 ? (
          filteredData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              onToggle={toggleNode}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        ) : (
          <p className="text-center py-6 text-xs text-slate-500">No matching hierarchy nodes.</p>
        )}
      </div>
    </div>
  );
}
