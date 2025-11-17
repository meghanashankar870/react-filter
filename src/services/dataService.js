// src/services/dataService.js
// Mock backend adapter with dynamic fields support (accounts/opportunity/quotes)
// Keeps the same response shape used by your UI.

const sampleRows = (() => {
  const cities = ["Winterfell","Casterly Rock","Kings Landing","Dragonstone","Highgarden","Riverrun"];
  const firstNames = ["Jon","Cersei","Jaime","Arya","Daenerys","Tyrion","Sansa","Bran"];
  const lastNames = ["Snow","Lannister","Stark","Targaryen","Baratheon","Tyrell","Tully"];
  const rows = [];
  for (let i = 1; i <= 200; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const accId = `acc_${(i%10)+1}`;
    const oppId = `opp_${(i%20)+1}`;
    const quoteId = `quote_${i}`;

    // Create some dynamic fields for account/opportunity/quote
    const accountDynamicFieldsReport = [
      { fieldId: `A_rate_${(i%3)+1}`, fieldName: `Account Rating ${(i%3)+1}` },
      { fieldId: `A_type_${(i%4)+1}`, fieldName: `Account Type ${(i%4)+1}` }
    ];

    const opportunityDynamicFieldsReport = [
      { fieldId: `O_score_${(i%5)+1}`, fieldName: `Opp Score ${(i%5)+1}` },
    ];

    const quoteDynamicFieldsReport = [
      { fieldId: `Q_discount_${(i%4)+1}`, fieldName: `Quote Discount ${(i%4)+1}` },
      { fieldId: `Q_revision_${(i%2)+1}`, fieldName: `Revision ${(i%2)+1}` }
    ];

    // For each dynamic field create a value (simple pattern)
    const accountDynamicFields = {};
    accountDynamicFieldsReport.forEach((f, idx) => {
      accountDynamicFields[f.fieldId] = `AR-${(i + idx) % 100}`;
    });

    const opportunityDynamicFields = {};
    opportunityDynamicFieldsReport.forEach((f, idx) => {
      opportunityDynamicFields[f.fieldId] = `${(i * (idx + 3)) % 100}`;
    });

    const quoteDynamicFields = {};
    quoteDynamicFieldsReport.forEach((f, idx) => {
      // make some discount/flag values
      quoteDynamicFields[f.fieldId] = idx % 2 === 0 ? `${5 * ((i % 4) + 1)}%` : `R${(i%3)+1}`;
    });

    rows.push({
      _id: `row_${i}`,
      id: i,
      firstName: fn,
      lastName: ln,
      fullName: `${fn} ${ln}`,
      age: 18 + (i % 50),
      city: cities[i % cities.length],
      account_id: {
        _id: accId,
        accounts: `Company ${(i % 10) + 1}`,
        owner: `Owner ${(i % 5) + 1}`,
        dynamicFieldsReport: accountDynamicFieldsReport,
        dynamicFields: accountDynamicFields,
      },
      opportunity_id: {
        _id: oppId,
        opportunity_name: `Opportunity ${(i % 20) + 1}`,
        dynamicFieldsReport: opportunityDynamicFieldsReport,
        dynamicFields: opportunityDynamicFields,
      },
      // quote-level dynamic fields
      dynamicFieldsReport: quoteDynamicFieldsReport,
      dynamicFields: quoteDynamicFields,
      quotes_name: `Quote #${i}`,
      quotes_id: quoteId,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      modifiedAt: new Date(Date.now() - (i % 5) * 3600000).toISOString(),
      template_type: i % 2 === 0 ? "A" : "B",
      quote_status: i % 3 === 0 ? "Approved" : "Draft",
    });
  }
  return rows;
})();

function parseFilterQuery(filterQuery) {
  if (!filterQuery) return [];
  const q = filterQuery.startsWith("&") ? filterQuery.slice(1) : filterQuery;
  const parts = q.split("&");
  const filters = [];
  let logic = "AND";
  parts.forEach((p) => {
    if (!p) return;
    const [left, right] = p.split("=");
    if (left === "logic") {
      logic = right?.toUpperCase() || "AND";
      return;
    }
    if (!right) return;
    if (right.includes(":")) {
      const [operator, ...rest] = right.split(":");
      const value = rest.join(":");
      filters.push({ field: left, operator, value: decodeURIComponent(value) });
    } else {
      filters.push({ field: left, operator: right, value: "" });
    }
  });
  return { filters, logic };
}

function applySingleFilter(row, filter) {
  const raw = row[filter.field] ?? "";
  const cell = String(raw).toLowerCase();
  const val = String(filter.value ?? "").toLowerCase();
  const numCell = Number(raw);
  const numVal = Number(filter.value);
  const bothNumbers = !Number.isNaN(numCell) && !Number.isNaN(numVal);

  switch (filter.operator) {
    case "gt":
    case "greaterThan":
      return bothNumbers ? numCell > numVal : false;
    case "lt":
    case "lessThan":
      return bothNumbers ? numCell < numVal : false;
    case "contains":
      return cell.includes(val);
    case "does not contains":
    case "doesNotContains":
      return !cell.includes(val);
    case "equals":
      return cell === val;
    case "does not equal":
    case "doesNotEqual":
      return cell !== val;
    case "startsWith":
      return cell.startsWith(val);
    case "ends with":
    case "endsWith":
      return cell.endsWith(val);
    case "isEmpty":
    case "is empty":
      return cell.trim() === "";
    case "isNotEmpty":
    case "is not empty":
      return cell.trim() !== "";
    case "is any of":
    case "isAnyOf":
      return val.split(",").map(v => v.trim()).includes(cell);
    default:
      return true;
  }
}

function applyFilters(rows, filterObj) {
  if (!filterObj || !filterObj.filters || filterObj.filters.length === 0) return rows;
  const { filters, logic } = filterObj;
  return rows.filter((r) => {
    const results = filters.map(f => applySingleFilter(r, f));
    if (logic === "OR") return results.some(Boolean);
    return results.every(Boolean);
  });
}

function applySort(rows, sortedQuery) {
  if (!sortedQuery) return rows;
  const q = sortedQuery.startsWith("&") ? sortedQuery.slice(1) : sortedQuery;
  const params = new URLSearchParams(q);
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder") || "asc";
  if (!sortBy) return rows;
  const dir = sortOrder === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const A = a[sortBy] ?? b[sortBy] ?? "";
    const B = b[sortBy] ?? a[sortBy] ?? "";
    const numA = Number(A);
    const numB = Number(B);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return dir * (numA - numB);
    }
    const sA = String(A).toLowerCase();
    const sB = String(B).toLowerCase();
    return dir * sA.localeCompare(sB);
  });
}

export async function fetchGridData({ page = 1, pageSize = 20, filterQuery = "", sortedQuery = "" } = {}) {
  // simulate network delay
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

  const filterObj = parseFilterQuery(filterQuery);
  let rows = sampleRows.map(r => r); // clone

  // Apply filtering and sorting (these operate on flattened keys too later in UI)
  rows = applyFilters(rows, filterObj);
  rows = applySort(rows, sortedQuery);

  const totalCount = rows.length;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);


  //change this when you got backend api
  return {
    status: 200,
    data: {
      data: pageRows,
      pagination: { totalCount },
    },
  };
}

// Mock download token endpoint (simple)
let mockDownloadTokens = {};
export async function requestDownloadToken({ allColumns = [], filterQuery = "", sortedQuery = "" } = {}) {
  const token = `tok_${Math.random().toString(36).slice(2, 9)}`;
  mockDownloadTokens[token] = { ready: false, url: null };
  setTimeout(() => {
    mockDownloadTokens[token] = { ready: true, url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==` };
  }, 2000 + Math.random() * 3000);
  return { status: 200, data: { token } };
}

export async function checkDownloadStatus(token) {
  await new Promise((r) => setTimeout(r, 200));
  const entry = mockDownloadTokens[token];
  if (!entry) return { status: 404 };
  if (!entry.ready) return { status: 202 };
  return { status: 200, data: { fileURL: entry.url } };
}


// Helper to switch to real backend quickly:
// Replace the implementation of fetchGridData and requestDownloadToken to call your real API endpoint using fetch/axios.
//How to convert mock fetch into real backend fetch