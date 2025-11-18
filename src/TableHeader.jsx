import React, { useEffect, useRef, useState } from "react";

export default function TableHeader({
  columnKey,//like qge,city
  title,//column header name shown to user
  width,//current width of the column
  onSort,//func to trigger table sorting
  sortConfig,//current sorting sate from app.jsx
  onResize,//func for resizing the column width
  onOpenFilter,//opens the filter panel for this column
  onHideColumn,//hides this column         // will be provided by App.jsx
  onOpenManageColumns,//opens column mangt poppup  // will be provided by App.jsx
  filterAnchor,
  activeHeader,
setActiveHeader,
pinned,
  onPinColumn,
  columnWidths

}) {
  const [localSort, setLocalSort] = useState(null);//sorting -asc & desc ,null->no sort
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const isFilteringNow = filterAnchor?.column === columnKey;


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
    e.target.classList.add("dragging");
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

  // Remove dragging class from all resizers
  document.querySelectorAll(".mui-resizer").forEach(el => {
    el.classList.remove("dragging");
  });
};

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onResize, columnKey]);

  return (
    <th
  style={{ width }}
  className={`table-header 
    ${activeHeader === columnKey ? "active-header" : ""}
    ${pinned?.left?.includes(columnKey) ? "pinned-left" : ""} 
  ${pinned?.right?.includes(columnKey) ? "pinned-right" : ""}`}
  onClick={() => setActiveHeader(columnKey)}
>
      <div className={`header-inner ${activeHeader === columnKey ? "active-header" : ""}`}>
        <div className="title-and-icons">
          <span className="col-title">{title}</span>
          {isFilteringNow && (
          <span className="filter-active-icon animated-filter">
          <svg width="18" height="24" viewBox="0 0 24 20">
          <path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" fill="currentColor" />
          </svg>
          </span>
)}

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
              <div
  className="menu-item"
  onClick={(e) => {
    const headerCell = e.currentTarget.closest("th");
    onOpenFilter(columnKey, headerCell);
  }}
>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                  <path d="M10 18h4v-2h-4v2zM3 10v2h18v-2H3zm3-6v2h12V4H6z"/>
                </svg>
                <span>Filter</span>
              </div>

              <div className="menu-separator"></div>

              <div className="menu-item" onClick={() => onPinColumn(columnKey, "left")}>
                <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
                <path d="M15 4v2h-1v5l3 3v2H7v-2l3-3V6H9V4h6zM5 4h2v16H5V4z"/>
                </svg>
                <span>Pin Left</span>
              </div>

              <div className="menu-item" onClick={() => onPinColumn(columnKey, "right")}>
              <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
              <path d="M9 4v2h1v5l-3 3v2h10v-2l-3-3V6h1V4H9zM17 4h2v16h-2V4z"/>
              </svg>
              <span>Pin Right</span>
              </div>

              <div className="menu-item" onClick={() => onPinColumn(columnKey, "none")}>
              <svg className="menu-icon" viewBox="0 0 24 24" height="18" width="18">
              <path d="M3 3l18 18-1.41 1.41-6.59-6.59V21h-2v-5.17L6.41 20.41 5 19l6-6V6h1.17L3 3z"/>
              </svg>
              <span>Unpin</span>
              </div>

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

        <div
  className="mui-resizer"
  onMouseDown={startDrag}
  onClick={(e) => e.stopPropagation()} // prevent header click
/>

      </div>
    </th>
  );
}
