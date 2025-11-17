// src/App.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import TableHeader from "./TableHeader";
import FilterPanel from "./FilterPanel";
import "./App.css";
import { fetchGridData, requestDownloadToken, checkDownloadStatus } from "./services/dataService";

function App() {
  const defaultColumns = [
    { key: "id", title: "ID", width: 70 },
    { key: "firstName", title: "First name", width: 160 },
    { key: "lastName", title: "Last name", width: 160 },
    { key: "age", title: "Age", width: 90 },
    { key: "fullName", title: "Full name", width: 220 },
    { key: "city", title: "City", width: 180 },
  ];

  // UI / grid state
  const [allColumns, setAllColumns] = useState(defaultColumns);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [columnWidths, setColumnWidths] = useState(Object.fromEntries(defaultColumns.map((c) => [c.key, c.width])));
  const [filters, setFilters] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [activeHeader, setActiveHeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const latestRequestRef = useRef(0);

  // paging & server-style queries
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortedQuery, setSortedQuery] = useState("");
  const [rowsLoading, setRowsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
  function handleClickOutside(e) {
    // if click is outside any .table-header-cell → remove active state
    if (!e.target.closest(".table-header-cell")) {
      setActiveHeader(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  useEffect(() => {
    const vis = JSON.parse(localStorage.getItem("Visibility") || "{}");
    setHiddenColumns([]); // initial
    
    const savedSortedQuery = JSON.parse(localStorage.getItem("Sorted Query") || '""');
    setSortedQuery(savedSortedQuery || "");
  }, []);

  // Build filterQuery from `filters` array
  useEffect(() => {
    if (!filters || filters.length === 0) {
      setFilterQuery("");
      localStorage.setItem("Filters", JSON.stringify(""));
      return;
    }
    const q = filters.map(f => `${f.column}=${f.operator}${f.value ? `:${encodeURIComponent(f.value)}` : ""}`).join("&");
    const queryString = `&${q}`;
    setFilterQuery(queryString);
    localStorage.setItem("Filters", JSON.stringify(queryString));
    setPage(1);
  }, [filters]);

  // Build sortedQuery from sortConfig
  useEffect(() => {
    if (!sortConfig.column || !sortConfig.direction) {
      setSortedQuery("");
      localStorage.setItem("Sorted Query", JSON.stringify(""));
      return;
    }
    const q = `&sortBy=${sortConfig.column}&sortOrder=${sortConfig.direction}`;
    setSortedQuery(q);
    localStorage.setItem("Sorted Query", JSON.stringify(q));
    setPage(1);
  }, [sortConfig]);

  // Fetch data (mock adapter) and then build dynamic columns
  useEffect(() => {
    const fetch = async () => {
      const requestId = ++latestRequestRef.current;
      setRowsLoading(true);
      try {
        const resp = await fetchGridData({ page, pageSize, filterQuery, sortedQuery });
        if (requestId !== latestRequestRef.current) return;
        if (resp.status === 200) {
          const returnedRows = resp.data.data || [];
          setTotalCount(resp.data.pagination?.totalCount || 0);

          // Build dynamic columns from first row (if any)
          const built = buildColumnsAndRows(returnedRows);
          setAllColumns(built.columns);
          setRows(built.rows);
        } else {
          setRows([]);
          setAllColumns(defaultColumns);
          setTotalCount(0);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setRows([]);
        setTotalCount(0);
      } finally {
        setRowsLoading(false);
        setLoading(false);
      }
    };
    fetch();
  }, [page, pageSize, filterQuery, sortedQuery]);

  // Helper: build columns and flattened rows with dynamic fields
  function buildColumnsAndRows(returnedRows) {
    if (!returnedRows || returnedRows.length === 0) {
      return { columns: defaultColumns, rows: [] };
    }

    // Example: use first row to detect dynamic fields
    const sample = returnedRows[0];

    // account dynamic fields
    const accountData =
      sample.account_id?.dynamicFieldsReport && sample.account_id.dynamicFieldsReport.length > 0
        ? sample.account_id.dynamicFieldsReport.map((f) => ({ header: `A :${f.fieldName}`, key: f.fieldId, width: 180 }))
        : [];

    // opportunity dynamic fields
    const opportunityData =
      sample.opportunity_id?.dynamicFieldsReport && sample.opportunity_id.dynamicFieldsReport.length > 0
        ? sample.opportunity_id.dynamicFieldsReport.map((f) => ({ header: `O :${f.fieldName}`, key: f.fieldId, width: 180 }))
        : [];

    // quote dynamic fields
    const quoteData =
      sample.dynamicFieldsReport && sample.dynamicFieldsReport.length > 0
        ? sample.dynamicFieldsReport.map((f) => ({ header: `Q :${f.fieldName}`, key: f.fieldId, width: 180 }))
        : [];

    // create column objects for UI
    const accountCols = accountData.map(c => ({ key: c.key, title: c.header, width: c.width }));
    const oppCols = opportunityData.map(c => ({ key: c.key, title: c.header, width: c.width }));
    const qCols = quoteData.map(c => ({ key: c.key, title: c.header, width: c.width }));

    // Merge: default columns first, then account/opportunity/quote dynamic columns
    const mergedColumns = [...defaultColumns, ...accountCols, ...oppCols, ...qCols];

    // Build flattened rows: take default fields + dynamic fields from nested objects
    const flatRows = returnedRows.map((r, idx) => {
      const row = {
        id: r.id ?? idx + 1,
        firstName: r.firstName ?? "",
        lastName: r.lastName ?? "",
        fullName: r.fullName ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`,
        age: r.age ?? "",
        city: r.city ?? "",
        // keep references for links if needed
        account_id: r.account_id?._id ?? "",
        oppo_id: r.opportunity_id?._id ?? "",
        quotes_id: r.quotes_id ?? r._id ?? "",
        // you can add more mapped fields here if needed
      };

      // populate account dynamic fields
      if (r.account_id?.dynamicFields && accountData.length > 0) {
        accountData.forEach((c) => {
          row[c.key] = r.account_id.dynamicFields?.[c.key] ?? "";
        });
      }

      // populate opportunity dynamic fields
      if (r.opportunity_id?.dynamicFields && opportunityData.length > 0) {
        opportunityData.forEach((c) => {
          row[c.key] = r.opportunity_id.dynamicFields?.[c.key] ?? "";
        });
      }

      // populate quote dynamic fields
      if (r.dynamicFields && quoteData.length > 0) {
        quoteData.forEach((c) => {
          row[c.key] = r.dynamicFields?.[c.key] ?? "";
        });
      }

      return row;
    });

    return { columns: mergedColumns, rows: flatRows };
  }

  // derived visible columns (filter out hidden columns)
  const visibleColumns = allColumns.filter((c) => !hiddenColumns.includes(c.key));

  // selection helpers
  useEffect(() => {
    setSelected(new Set());
    setSelectAll(false);
  }, [rows]);

  const toggleRowSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
    setSelectAll(s.size === rows.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
    setSelectAll(!selectAll);
  };

  // Sort handler
  const handleSort = (columnKey, direction) => {
    setSortConfig(prev => {
      if (prev.column === columnKey && prev.direction === direction) {
        return { column: null, direction: null };
      }
      return { column: columnKey, direction };
    });
  };

  // Filter opener (passes column to FilterPanel via anchor)
  const openFilterForColumn = (columnKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFilterAnchor({ left: rect.left, bottom: rect.bottom, column: columnKey });
    setFilters([{ column: columnKey, operator: "contains", value: "" }]);
  };

  const onFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Toggle hide column
  const toggleColumn = (colKey) => {
    setHiddenColumns(prev => prev.includes(colKey) ? prev.filter(k => k !== colKey) : [...prev, colKey]);
  };

  // Column resize handler
  const onColumnResize = (k, delta) => {
    setColumnWidths(prev => ({ ...prev, [k]: Math.max(40, (prev[k] || 80) + delta) }));
  };

  // Download flow (mock)
  const handleDownload = async () => {
    if (rows.length === 0) {
      alert("Empty report cannot be downloaded");
      return;
    }
    setDownloading(true);
    const defaultCols = allColumns.map(c => ({ header: c.title, key: c.key, width: c.width || 30 }));
    try {
      const tokenResp = await requestDownloadToken({ allColumns: defaultCols, filterQuery, sortedQuery });
      if (tokenResp?.data?.token) {
        const token = tokenResp.data.token;
        const interval = setInterval(async () => {
          const status = await checkDownloadStatus(token);
          if (status.status === 200) {
            clearInterval(interval);
            setDownloading(false);
            const fileURL = status.data.fileURL;
            const link = document.createElement("a");
            link.href = fileURL;
            link.download = "report.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (status.status === 202) {
            setDownloading(true);
          }
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setDownloading(false);
    }
  };

  // UI size control
  const [tableSize, setTableSize] = useState("medium");
  const sizeStyle = tableSize === "small" ? { fontSize: "12px", padding: "4px" } :
                    tableSize === "large" ? { fontSize: "16px", padding: "14px" } :
                    { fontSize: "14px", padding: "10px" };

  return (
    <div className="table-wrapper">
      <h2 style={{ margin: "10px 0" }}>DataGrid Table</h2>

      <div className="mui-toolbar">
        <button className="mui-btn mui-btn-primary" onClick={() => { setFilters([]); setSortConfig({column:null,direction:null}); setHiddenColumns([]); setPage(1); }}>
          Reset Filters & Sort
        </button>

        <button className="mui-btn mui-btn-outline" onClick={() => setHiddenColumns([])}>
          Show All Columns
        </button>

        <select value={tableSize} onChange={(e) => setTableSize(e.target.value)} className="mui-select">
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
                  sortConfig={{ column: sortConfig.column, direction: sortConfig.direction }}
                  onResize={onColumnResize}
                  onOpenFilter={openFilterForColumn}
                  onHideColumn={() => toggleColumn(col.key)}
                  onOpenManageColumns={() => setManageOpen(true)}
                  filterAnchor={filterAnchor}
                  activeHeader={activeHeader}
                  setActiveHeader={setActiveHeader}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {rowsLoading ? (
              <tr><td colSpan={visibleColumns.length + 1} style={{ padding: 24, textAlign: "center" }}>Loading...</td></tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id || row._id}>
                  <td style={{ width: 48 }} className="sticky-col">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRowSelect(row.id)} />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                </tr>
              ))
            ) : (
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
        columns={allColumns}
        onChange={onFiltersChange}
        activeFilters={filters}
        anchor={filterAnchor}
        onClose={() => setFilterAnchor(null)}
      />

      {manageOpen && (
        <div className="manage-columns-overlay">
          <div className="manage-columns-box">
            <div className="mc-header">
              <strong>Manage Columns</strong>
              <button className="mc-close" onClick={() => setManageOpen(false)}>✕</button>
            </div>
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
            <div className="mc-list">
              {allColumns.map((col) => (
                <div key={col.key} className="mc-item" data-label={col.title}>
                  <input type="checkbox" checked={!hiddenColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} />
                  <span>{col.title}</span>
                </div>
              ))}
            </div>
            <div className="mc-footer">
              <button className="mc-footer-btn" onClick={() => setHiddenColumns([])}>Show/Hide All</button>
              <button className="mc-reset" onClick={() => { setHiddenColumns([]); setManageOpen(false); }}>RESET</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <strong>Selected IDs:</strong> {[...selected].join(", ") || "—"}
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <button disabled={page === 1} onClick={() => setPage(1)} className="mui-btn">First</button>
          <button disabled={page === 1} onClick={() => setPage(prev => Math.max(prev - 1, 1))} className="mui-btn">Prev</button>
          <span style={{ margin: "0 12px" }}>Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
          <button disabled={page * pageSize >= totalCount} onClick={() => setPage(prev => prev + 1)} className="mui-btn">Next</button>
          <button disabled={page * pageSize >= totalCount} onClick={() => setPage(Math.max(1, Math.ceil(totalCount / pageSize)))} className="mui-btn">Last</button>
        </div>

        <div>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="mui-select">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button className="mui-btn mui-btn-primary" onClick={handleDownload} disabled={downloading} style={{ marginLeft: 8 }}>
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
