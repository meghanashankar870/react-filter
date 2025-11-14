import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function FilterPanel({
  columns = [],
  onChange,
  activeFilters = [],
  anchor,
  onClose
}) {

  if (!anchor) return null;

  const [filters, setFilters] = useState(
    activeFilters.length
      ? activeFilters
      : [{ column: columns[0]?.key, operator: "contains", value: "" }]
  );

  useEffect(() => {
    if (onChange) onChange(filters);
  }, [filters]);

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  const updateFilter = (i, key, val) => {
    const next = [...filters];
    next[i] = { ...next[i], [key]: val };
    setFilters(next);
  };

  /** ⭐ KEY FIXES ⭐ **/
  const popupStyle = {
    position: "fixed",
    top: anchor.top + 40,        // ✔ shows popup closer under header
    left: anchor.left - 20,      // ✔ aligns under 3-dot menu
    zIndex: 9999,
    width: "380px",              // ✔ wider popup so content fits
    background: "white",
    borderRadius: "10px",
    border: "1px solid #ddd",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    padding: "16px"
  };

  const rowStyle = {
    display: "flex",
    flexWrap: "wrap",            // ✔ fixes overflow
    gap: "10px",
    background: "#fafafa",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e6e6e6",
    marginBottom: "10px"
  };

  const selectStyle = {
    flex: "1 1 120px",           // ✔ responsive
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  };

  const inputStyle = {
    flex: "2 1 140px",           // ✔ input will not overflow
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  };

  return ReactDOM.createPortal(
    <div style={popupStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>Filter</strong>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>

      {filters.map((f, i) => (
        <div key={i} style={rowStyle}>
          <select
            style={selectStyle}
            value={f.column}
            onChange={(e) => updateFilter(i, "column", e.target.value)}
          >
            {columns.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={f.operator}
            onChange={(e) => updateFilter(i, "operator", e.target.value)}
          >
            <option value="contains">contains</option>
            <option value="equals">equals</option>
            <option value="startsWith">starts with</option>
            <option value="gt">greater than</option>
            <option value="lt">less than</option>
          </select>

          <input
            placeholder="Value"
            style={inputStyle}
            value={f.value}
            onChange={(e) => updateFilter(i, "value", e.target.value)}
          />
        </div>
      ))}

      <div style={{ textAlign: "right", marginTop: 10 }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 14px",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Apply
        </button>
      </div>
    </div>,

    document.getElementById("filter-portal")
  );
}
