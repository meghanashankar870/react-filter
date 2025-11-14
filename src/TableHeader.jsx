import React, { useEffect, useRef, useState } from "react";

export default function TableHeader({
  columnKey,
  title,
  width,
  onSort,
  sortConfig,
  onResize,
  onOpenFilter,
  onHideColumn,         // will be provided by App.jsx
  onOpenManageColumns,  // will be provided by App.jsx
}) {
  const [localSort, setLocalSort] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (sortConfig.column === columnKey) setLocalSort(sortConfig.direction);
    else setLocalSort(null);
  }, [sortConfig, columnKey]);

  const handleSort = (dir) => {
    setLocalSort(dir);
    if (onSort) onSort(columnKey, dir);
  };

  // Resizing logic
  const startX = useRef(0);
  const dragging = useRef(false);

  const startDrag = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      if (onResize) onResize(columnKey, delta);
      startX.current = e.clientX;
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onResize, columnKey]);

  return (
    <th style={{ width }} className="table-header">
      <div className="header-inner">
        <div className="title-and-icons">
          <span className="col-title">{title}</span>

          <div className="sort-icons">
            <span
              className={`arrow up ${localSort === "asc" ? "active" : ""}`}
              onClick={() => handleSort("asc")}
            >
              ▲
            </span>
            <span
              className={`arrow down ${localSort === "desc" ? "active" : ""}`}
              onClick={() => handleSort("desc")}
            >
              ▼
            </span>
          </div>
        </div>

        {/* CLICK 3-DOTS menu */}
        <div className="menu-wrapper" ref={menuRef}>
          <span className="dots" onClick={() => setMenuOpen((v) => !v)}>⋮</span>

          {menuOpen && (
            <div className="mui-menu-popup">
              <div className="menu-item" onClick={() => handleSort("asc")}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z"/>
                </svg>
                <span>Sort by ASC</span>
              </div>

              <div className="menu-item" onClick={() => handleSort("desc")}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M4 12l1.41-1.41L11 16.17V4h2v12.17l5.59-5.58L20 12l-8 8-8-8z"/>
                </svg>
                <span>Sort by DESC</span>
              </div>

              <div className="menu-separator"></div>

              {/* Pass the columnKey to onOpenFilter */}
              <div className="menu-item" onClick={(e) => onOpenFilter(columnKey,e)}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M10 18h4v-2h-4v2zM3 10v2h18v-2H3zm3-6v2h12V4H6z"/>
                </svg>
                <span>Filter</span>
              </div>

              <div className="menu-separator"></div>

              {/* CALL app's onHideColumn */}
              <div className="menu-item" onClick={() => onHideColumn && onHideColumn(columnKey)}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l3.92 3.92-1.41 1.41-3.92-3.92A4.97 4.97 0 0 1 12 17a5 5 0 1 1 0-10zm0-2C7 5 2.73 8.11 1 12c.61 1.43 1.53 2.74 2.69 3.84l-1.42 1.42C.98 15.87 0 14.02 0 12c2-4.42 6.58-8 12-8 2.02 0 3.87.98 5.26 2.27l-1.42 1.42A9.948 9.948 0 0 0 12 5z"/>
                </svg>
                <span>Hide column</span>
              </div>

              {/* CALL app's manage popup opener */}
              <div className="menu-item" onClick={() => onOpenManageColumns && onOpenManageColumns()}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M4 10h4V4H4v6zm6 0h4V4h-4v6zm6 0h4V4h-4v6zM4 20h4v-6H4v6zm6 0h4v-6h-4v6zm6 0h4v-6h-4v6z"/>
                </svg>
                <span>Manage columns</span>
              </div>
            </div>
          )}
        </div>

        <div className="resizer" onMouseDown={startDrag}></div>
      </div>
    </th>
  );
}
