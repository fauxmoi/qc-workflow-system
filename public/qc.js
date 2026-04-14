// qc.js
async function submitInstruction() {
  const barrelId = document.getElementById("barrelId").value.trim();
  const testResult = document.getElementById("testResult").value;
  const instruction = document.getElementById("instruction").value.trim();
  const msg = document.getElementById("msg");

  if (!barrelId || !testResult || !instruction) {
    msg.textContent = "Please fill in all fields.";
    return;
  }

  const res = await fetch("/api/instructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barrelId, testResult, instruction }),
  });

  if (res.ok) {
    msg.textContent = "Submitted. Status: pending.";
    document.getElementById("barrelId").value = "";
    document.getElementById("testResult").value = "";
    document.getElementById("instruction").value = "";
  } else {
    msg.textContent = "Error submitting.";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitInstruction);
  }
});