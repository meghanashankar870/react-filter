import React, { useEffect, useMemo, useState } from "react";
import TableHeader from "./TableHeader";
import FilterPanel from "./FilterPanel";
import "./App.css";

function App() {
  const initialData = [
    { id: 1, firstName: "Jon", lastName: "Snow", age: 35, city: "Winterfell" },
    { id: 2, firstName: "Cersei", lastName: "Lannister", age: 42, city: "Casterly Rock" },
    { id: 3, firstName: "Jaime", lastName: "Lannister", age: 45, city: "Kings Landing" },
    { id: 4, firstName: "Arya", lastName: "Stark", age: 16, city: "Winterfell" },
    { id: 5, firstName: "Daenerys", lastName: "Targaryen", age: 28, city: "Dragonstone" },
  ];

  // auto generate fullName
  const dataWithFullName = initialData.map((r) => ({
    ...r,
    fullName: `${r.firstName} ${r.lastName}`,
  }));

  // column definitions (also controls default widths)
  const defaultColumns = [
    { key: "id", title: "ID", width: 70 },
    { key: "firstName", title: "First name", width: 160 },
    { key: "lastName", title: "Last name", width: 160 },
    { key: "age", title: "Age", width: 90 },
    { key: "fullName", title: "Full name", width: 220 },
    { key: "city", title: "City", width: 180 },
  ];

  const [data, setData] = useState(dataWithFullName);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // sort config
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

  const [columnWidths, setColumnWidths] = useState(
    Object.fromEntries(defaultColumns.map((c) => [c.key, c.width]))
  );

  const [filterPosition, setFilterPosition] = useState(null);
  const [filters, setFilters] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // ---------- NEW: hiddenColumns state ----------
  const [hiddenColumns, setHiddenColumns] = useState([]); // array of column keys hidden
  const hideColumn = (colKey) => {
    setHiddenColumns((prev) => (prev.includes(colKey) ? prev : [...prev, colKey]));
  };
  const showColumn = (colKey) => {
    setHiddenColumns((prev) => prev.filter((k) => k !== colKey));
  };

  // Manage columns panel open state
  const [manageOpen, setManageOpen] = useState(false);

  const toggleColumn = (colKey) => {
    setHiddenColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  // sorting handler
  const handleSort = (column, direction) => {
    setSortConfig((prev) => {
      if (prev.column === column && prev.direction === direction) {
        return { column: null, direction: null };
      }
      return { column, direction };
    });
  };

  // comparator (robust)
  const compareValues = (A, B, direction = "asc") => {
    if (A === undefined || A === null) A = "";
    if (B === undefined || B === null) B = "";
    const numA = Number(A);
    const numB = Number(B);
    const bothNumbers = Number.isFinite(numA) && Number.isFinite(numB);
    if (bothNumbers) return direction === "asc" ? numA - numB : numB - numA;
    const sA = String(A).trim().toLowerCase();
    const sB = String(B).trim().toLowerCase();
    const cmp = sA.localeCompare(sB, undefined, { numeric: true, sensitivity: "base" });
    return direction === "asc" ? cmp : -cmp;
  };

  // processed data (filters then sort)
  const processedData = useMemo(() => {
    let rows = [...data];

    if (Array.isArray(filters) && filters.length > 0) {
  rows = rows.filter((row) =>
    filters.every((f) => {
      const raw = row[f.column];
      const cell = String(raw ?? "").toLowerCase();
      const val = String(f.value ?? "").toLowerCase();

      // numeric compare if both valid numbers
      const numCell = Number(raw);
      const numVal = Number(f.value);

      if (!isNaN(numCell) && !isNaN(numVal)) {
        if (f.operator === "gt") return numCell > numVal;
        if (f.operator === "lt") return numCell < numVal;
      }

      // text compares
      if (f.operator === "contains") return cell.includes(val);
      if (f.operator === "equals") return cell === val;
      if (f.operator === "startsWith") return cell.startsWith(val);

      return true;
    })
  );
}


    if (sortConfig.column && sortConfig.direction) {
      const col = sortConfig.column;
      rows.sort((a, b) => compareValues(a[col], b[col], sortConfig.direction));
    }

    return rows;
  }, [data, filters, sortConfig]);

  // selection handlers
  useEffect(() => {
    setSelected(new Set());
    setSelectAll(false);
  }, [processedData]);

  const toggleRowSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
    setSelectAll(s.size === processedData.length && processedData.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(processedData.map((r) => r.id)));
      setSelectAll(true);
    }
  };

  const handleColumnResize = (columnKey, delta) => {
    setColumnWidths((prev) => {
      const next = { ...prev };
      const newWidth = Math.max(40, (next[columnKey] || 80) + delta);
      next[columnKey] = newWidth;
      return next;
    });
  };

  // receive filters
  const onFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // columns to render (exclude hidden)
  const visibleColumns = defaultColumns.filter((c) => !hiddenColumns.includes(c.key));

  return (
    <div className="table-wrapper">
      <h2 style={{ margin: "10px 0" }}>Custom Data Table (All features)</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {/* checkbox column header */}
              <th style={{ width: 48 }} className="sticky-col">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>

              {visibleColumns.map((col) => (
                <TableHeader
                  key={col.key}
                  columnKey={col.key}
                  title={col.title}
                  width={columnWidths[col.key]}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  onResize={handleColumnResize}
                 onOpenFilter={(columnKey, event) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setFilterAnchor({
    left: rect.left,
    bottom: rect.bottom,
  });

  setFilters([{ column: columnKey, operator: "contains", value: "" }]);
}}




                  onHideColumn={(column) => hideColumn(column)}           // <-- wired
                  onOpenManageColumns={() => setManageOpen(true)}          // <-- wired
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {processedData.map((row) => (
              <tr key={row.id} className="table-row">
                <td style={{ width: 48 }} className="sticky-col">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRowSelect(row.id)}
                    aria-label={`Select row ${row.id}`}
                  />
                </td>

                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    style={{ width: columnWidths[col.key], maxWidth: columnWidths[col.key] }}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}

            {processedData.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 1} style={{ padding: 24, textAlign: "center" }}>
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filter panel (floating) */}
      <FilterPanel
  columns={defaultColumns}
  onChange={onFiltersChange}
  activeFilters={filters}
  anchor={filterAnchor}
  onClose={() => setFilterAnchor(null)}
/>

      {/* Manage columns modal/popup */}
      {manageOpen && (
        <div className="manage-popup" role="dialog" aria-label="Manage Columns">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Manage columns</h4>
            <button onClick={() => setManageOpen(false)}>Close</button>
          </div>

          <div style={{ marginTop: 10 }}>
            {defaultColumns.map((col) => (
              <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <input
                  type="checkbox"
                  checked={!hiddenColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                />
                <span>{col.title}</span>
                {/* add quick show/hide buttons */}
                <button
                  style={{ marginLeft: "auto" }}
                  onClick={() => (hiddenColumns.includes(col.key) ? showColumn(col.key) : hideColumn(col.key))}
                >
                  {hiddenColumns.includes(col.key) ? "Show" : "Hide"}
                </button>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <strong>Selected IDs:</strong> {[...selected].join(", ") || "—"}
      </div>
    </div>
  );
}

export default App;
