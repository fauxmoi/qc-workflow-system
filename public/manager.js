// manager.js
async function load() {
  const res = await fetch("/api/instructions?status=pending");
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
    const approveBtn = document.createElement("button");
    approveBtn.className = "btn-approve";
    approveBtn.textContent = "Approve";
    approveBtn.addEventListener("click", () => updateStatus(r._id, "approved"));

    const rejectBtn = document.createElement("button");
    rejectBtn.className = "btn-reject";
    rejectBtn.textContent = "Reject";
    rejectBtn.addEventListener("click", () => updateStatus(r._id, "rejected"));

    const actionsCell = document.createElement("td");
    actionsCell.appendChild(approveBtn);
    actionsCell.appendChild(rejectBtn);

    tr.innerHTML = `
      <td>${r.barrelId}</td>
      <td>${r.testResult}</td>
      <td>${r.instruction}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
    `;
    tr.appendChild(actionsCell);
    tbody.appendChild(tr);
  });
}

async function updateStatus(id, status) {
  await fetch(`/api/instructions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  load();
}

load();