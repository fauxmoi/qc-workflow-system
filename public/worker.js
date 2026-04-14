// worker.js
async function load() {
  const res = await fetch("/api/instructions?status=approved");
  const rows = await res.json();
  const tbody = document.getElementById("tbody");
  const empty = document.getElementById("empty");
  tbody.innerHTML = "";

  if (rows.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Mark as Done";
    doneBtn.addEventListener("click", () => markDone(r._id));

    const actionsCell = document.createElement("td");
    actionsCell.appendChild(doneBtn);

    tr.innerHTML = `
      <td>${r.barrelId}</td>
      <td>${r.testResult}</td>
      <td>${r.instruction}</td>
      <td>${new Date(r.updatedAt || r.createdAt).toLocaleString()}</td>
    `;
    tr.appendChild(actionsCell);
    tbody.appendChild(tr);
  });
}

async function markDone(id) {
  await fetch(`/api/instructions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" }),
  });
  load();
}

load();