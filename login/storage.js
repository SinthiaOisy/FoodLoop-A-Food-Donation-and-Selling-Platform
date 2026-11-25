function getList(key) {
  const text = localStorage.getItem(key);
  if (!text) return [];
  return text.split("\n").map(function (line) { return line.split("|"); });
}

function saveList(key, rows) {
  localStorage.setItem(key, rows.map(function (row) { return row.join("|"); }).join("\n"));
}

function clean(text) {
  return String(text).replace(/[|\n\r]/g, " ").trim();
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}