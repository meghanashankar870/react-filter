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

  const dataWithFullName = initialData.map((r) => ({
    ...r,
    fullName: `${r.firstName} ${r.lastName}`,
  }));

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

  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [columnWidths, setColumnWidths] = useState(
    Object.fromEntries(defaultColumns.map((c) => [c.key, c.width]))
  );

  const [filters, setFilters] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);

  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);

  const hideColumn = (colKey) => {
    setHiddenColumns((prev) => [...prev, colKey]);
  };
  const showColumn = (colKey) => {
    setHiddenColumns((prev) => prev.filter((k) => k !== colKey));
  };
  const toggleColumn = (colKey) => {
    setHiddenColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  const handleSort = (column, direction) => {
    setSortConfig((prev) => {
      if (prev.column === column && prev.direction === direction) {
        return { column: null, direction: null };
      }
      return { column, direction };
    });
  };

  const compareValues = (A, B, direction = "asc") => {
    if (A === undefined || A === null) A = "";
    if (B === undefined || B === null) B = "";
    const numA = Number(A);
    const numB = Number(B);
    const bothNumbers = Number.isFinite(numA) && Number.isFinite(numB);

    if (bothNumbers) {
      return direction === "asc" ? numA - numB : numB - numA;
    }

    const sA = String(A).trim().toLowerCase();
    const sB = String(B).trim().toLowerCase();
    const cmp = sA.localeCompare(sB);

    return direction === "asc" ? cmp : -cmp;
  };

  const processedData = useMemo(() => {
    let rows = [...data];

    if (filters.length > 0) {
      rows = rows.filter((row) =>
        filters.every((f) => {
          const raw = row[f.column];
          const cell = String(raw ?? "").toLowerCase();
          const val = String(f.value ?? "").toLowerCase();

          const numCell = Number(raw);
          const numVal = Number(f.value);

          if (!isNaN(numCell) && !isNaN(numVal)) {
            if (f.operator === "gt") return numCell > numVal;
            if (f.operator === "lt") return numCell < numVal;
          }

          if (f.operator === "contains") return cell.includes(val);
          if (f.operator === "does not contains")
            return !cell.includes(val);

          if (f.operator === "equals") return cell === val;
          if (f.operator === "does not equal")
            return cell !== val;

          if (f.operator === "startsWith") return cell.startsWith(val);
          if (f.operator === "ends with")
            return cell.endsWith(val);

          if (f.operator === "is empty")
        return cell.trim() === "";

      if (f.operator === "is not empty")
        return cell.trim() !== "";

      // ----------------------
      // MULTIPLE VALUES → “is any of”
      // value example: "jon, arya, snow"
      // ----------------------
      if (f.operator === "is any of") {
        const list = val.split(",").map((v) => v.trim());
        return list.includes(cell);
      }
          return true;
        })
      );
    }

    if (sortConfig.column && sortConfig.direction) {
      rows.sort((a, b) => compareValues(a[sortConfig.column], b[sortConfig.column], sortConfig.direction));
    }

    return rows;
  }, [data, filters, sortConfig]);

  useEffect(() => {
    setSelected(new Set());
    setSelectAll(false);
  }, [processedData]);

  const toggleRowSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
    setSelectAll(s.size === processedData.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(processedData.map((r) => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const onFiltersChange = (newFilters) => setFilters(newFilters);

  const visibleColumns = defaultColumns.filter((c) => !hiddenColumns.includes(c.key));

  // ⭐ Toolbar Logic
  const resetFiltersAndSort = () => {
    setFilters([]);
    setSortConfig({ column: null, direction: null });
  };

  const showAllColumns = () => setHiddenColumns([]);

  const [tableSize, setTableSize] = useState("medium");

  const sizeStyle =
    tableSize === "small"
      ? { fontSize: "12px", padding: "4px" }
      : tableSize === "large"
      ? { fontSize: "16px", padding: "14px" }
      : { fontSize: "14px", padding: "10px" };

  return (
    <div className="table-wrapper">
      <h2 style={{ margin: "10px 0" }}>Premium Data Table</h2>

      {/* ⭐ MUI Styled Toolbar */}
      <div className="mui-toolbar">
        <button className="mui-btn mui-btn-primary" onClick={resetFiltersAndSort}>
          Reset Filters & Sort
        </button>

        <button className="mui-btn mui-btn-outline" onClick={showAllColumns}>
          Show All Columns
        </button>

        <select
          value={tableSize}
          onChange={(e) => setTableSize(e.target.value)}
          className="mui-select"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="table-container" style={sizeStyle}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }} className="sticky-col">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              </th>

              {visibleColumns.map((col) => (
                <TableHeader
                  key={col.key}
                  columnKey={col.key}
                  title={col.title}
                  width={columnWidths[col.key]}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  onResize={(k, d) =>
                    setColumnWidths((prev) => ({
                      ...prev,
                      [k]: Math.max(40, (prev[k] || 80) + d),
                    }))
                  }
                  onOpenFilter={(columnKey, event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setFilterAnchor({ left: rect.left, bottom: rect.bottom });
                    setFilters([{ column: columnKey, operator: "contains", value: "" }]);
                  }}
                  onHideColumn={hideColumn}
                  onOpenManageColumns={() => setManageOpen(true)}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {processedData.map((row) => (
              <tr key={row.id}>
                <td style={{ width: 48 }} className="sticky-col">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRowSelect(row.id)} />
                </td>

                {visibleColumns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
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

      <FilterPanel
        columns={defaultColumns}
        onChange={onFiltersChange}
        activeFilters={filters}
        anchor={filterAnchor}
        onClose={() => setFilterAnchor(null)}
      />

      {manageOpen && (
  <div className="manage-columns-overlay">
    <div className="manage-columns-box">
      
      {/* Header */}
      <div className="mc-header">
        <strong>Manage Columns</strong>
        <button className="mc-close" onClick={() => setManageOpen(false)}>✕</button>
      </div>

      {/* Search box */}
      <input
        type="text"
        placeholder="Search columns..."
        className="mc-search"
        onChange={(e) => {
          const v = e.target.value.toLowerCase();
          document.querySelectorAll(".mc-item").forEach((el) => {
            const name = el.dataset.label.toLowerCase();
            el.style.display = name.includes(v) ? "flex" : "none";
          });
        }}
      />

      {/* Column List */}
      <div className="mc-list">
        {defaultColumns.map((col) => (
          <div
            key={col.key}
            className="mc-item"
            data-label={col.title}
          >
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col.key)}
              onChange={() => toggleColumn(col.key)}
            />
            <span>{col.title}</span>
          </div>
        ))}
      </div>

      {/* Footer Bottom */}
      <div className="mc-footer">
        <button
          className="mc-footer-btn"
          onClick={() => setHiddenColumns([])}
        >
          Show/Hide All
        </button>

        <button
          className="mc-reset"
          onClick={() => {
            setHiddenColumns([]);
            setManageOpen(false);
          }}
        >
          RESET
        </button>
      </div>
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
