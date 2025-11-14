import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export default function FilterPanel({
  columns = [],
  anchor,
  onClose,
  onChange,
  activeFilters = []
}) {
  // ❗ Render nothing until the user clicks Filter
  if (!anchor) return null;

  // one filter row
  const [filter, setFilter] = useState(
    activeFilters.length
      ? activeFilters[0]
      : { column: columns[0]?.key, operator: "contains", value: "" }
  );

  useEffect(() => {
    onChange([filter]);
  }, [filter, onChange]);

  // popup positioning
  const popupWidth = 520;
  const left = Math.max(
    8,
    Math.min(anchor.left - 60, window.innerWidth - popupWidth - 8)
  );

  const top = anchor.bottom - 80;

  const popupStyle = {
    position: "fixed",
    top,
    left,
    width: popupWidth,
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    padding: "24px 26px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
    zIndex: 9999
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12
  };

  const selectStyle = {
    padding: "10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    flex: 1,
    background: "#fff"
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    flex: 1
  };

  const closeBtnStyle = {
    fontSize: 18,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "4px 6px"
  };

  return ReactDOM.createPortal(
    <div style={popupStyle}>
      <div style={rowStyle}>
        {/* Close icon */}
        <button style={closeBtnStyle} onClick={onClose}>
          ✕
        </button>

        {/* Column dropdown */}
        <select
          style={selectStyle}
          value={filter.column}
          onChange={(e) =>
            setFilter({ ...filter, column: e.target.value })
          }
        >
          {columns.map((c) => (
            <option key={c.key} value={c.key}>
              {c.title}
            </option>
          ))}
        </select>

        {/* Operator dropdown */}
        <select
          style={selectStyle}
          value={filter.operator}
          onChange={(e) =>
            setFilter({ ...filter, operator: e.target.value })
          }
        >
          <option value="contains">contains</option>
          <option value="does not contains">does not contains</option>
          <option value="equals">equals</option>
          <option value="does not equal">does not equal</option>
          <option value="startsWith">starts with</option>
          <option value="ends with">ends with</option>
          <option value="gt">greater than</option>
          <option value="lt">less than</option>
          <option value="is empty">is empty</option>
          <option value="is not empty">is not empty</option>
          <option value="is any of">is any of</option>
        </select>

        {/* Value input */}
        <input
          style={inputStyle}
          placeholder="Filter value"
          value={filter.value}
          onChange={(e) =>
            setFilter({ ...filter, value: e.target.value })
          }
        />
      </div>
    </div>,
    document.getElementById("filter-portal")
  );
}
