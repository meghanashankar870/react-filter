import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function FilterPanel({ columns = [], onChange, activeFilters = [], anchor, onClose }) {
  // Do not render if no anchor
  if (!anchor) return null;

  const [filters, setFilters] = useState(
    activeFilters && activeFilters.length ? activeFilters : [{ column: anchor.columnKey || columns[0]?.key, operator: "contains", value: "" }]
  );

  useEffect(() => {
    if (onChange) onChange(filters);
  }, [filters, onChange]);

  useEffect(() => {
    if (activeFilters && activeFilters.length) setFilters(activeFilters);
  }, [activeFilters]);

  const updateFilter = (i, key, val) => {
    setFilters((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  };

  const addFilter = () => setFilters((p) => [...p, { column: columns[0]?.key, operator: "contains", value: "" }]);
  const removeFilter = (i) => setFilters((p) => p.filter((_, idx) => idx !== i));

  const popupWidth = 380;
  // position calculation — keep inside viewport
  const rawLeft = Math.max(8, anchor.left - 20);
  const left = Math.min(rawLeft, window.innerWidth - popupWidth - 8);
  const top = Math.max(8, anchor.bottom + 8); // anchor.bottom is viewport coordinate

  const popupStyle = {
    position: "fixed",
    top,
    left,
    width: popupWidth,
    zIndex: 9999,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e6e6e6",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    padding: 14,
    transition: "opacity 120ms ease, transform 120ms ease",
    transformOrigin: "top left",
  };

  const rowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    background: "#fafafa",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #f0f0f0",
    marginBottom: 10,
    alignItems: "center",
  };

  const selectStyle = { flex: "1 1 120px", padding: 8, borderRadius: 6, border: "1px solid #ddd" };
  const inputStyle = { flex: "2 1 150px", padding: 8, borderRadius: 6, border: "1px solid #ddd" };
  const smallBtn = { padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" };

  return ReactDOM.createPortal(
    <div style={popupStyle} role="dialog" aria-label="Column filter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Filters</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { addFilter(); }} style={{ ...smallBtn, background: "#f3f3f3" }}>+ Add</button>
          <button onClick={() => { setFilters([]); }} style={{ ...smallBtn, background: "#fff", border: "1px solid #eee" }}>Clear</button>
          <button onClick={onClose} style={{ ...smallBtn, background: "#1976d2", color: "#fff" }}>Apply</button>
        </div>
      </div>

      {filters.map((f, i) => (
        <div key={i} style={rowStyle}>
          <select style={selectStyle} value={f.column} onChange={(e) => updateFilter(i, "column", e.target.value)}>
            {columns.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
          </select>

          <select style={selectStyle} value={f.operator} onChange={(e) => updateFilter(i, "operator", e.target.value)}>
            <option value="contains">contains</option>
            <option value="equals">equals</option>
            <option value="startsWith">starts with</option>
            <option value="gt">greater than</option>
            <option value="lt">less than</option>
          </select>

          <input style={inputStyle} placeholder="Value" value={f.value} onChange={(e) => updateFilter(i, "value", e.target.value)} />

          <button style={{ ...smallBtn, background: "#ffecec", marginLeft: 6 }} onClick={() => removeFilter(i)}>✕</button>
        </div>
      ))}
    </div>,
    document.getElementById("filter-portal")
  );
}
