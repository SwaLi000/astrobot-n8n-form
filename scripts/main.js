// ========== Config ==============
const ENDPOINT_SUBMIT = "https://bot.tinkerwithswaroop.live/webhook/form";
const ENDPOINT_SLOTS = "https://bot.tinkerwithswaroop.live/webhook/form";
const ENDPOINT_VALIDATE =
  "https://bot.tinkerwithswaroop.live/webhook/form/validate";
// ==========

// Device-adaptive UPI logic & copy functionality
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

document.addEventListener("DOMContentLoaded", function () {
  // UPI mobile/desktop logic
  const upiBtn = document.getElementById("upiPayBtn");
  const desktopMsg = document.getElementById("upiDesktopMsg");
  if (isMobile()) {
    if (upiBtn) upiBtn.style.display = "inline-block";
    if (desktopMsg) desktopMsg.style.display = "none";
  } else {
    if (upiBtn) upiBtn.style.display = "none";
    if (desktopMsg) desktopMsg.style.display = "block";
  }

  // Copy UPI ID logic
  const copyBtn = document.getElementById("copyUpiBtn");
  const copyMsg = document.getElementById("copyMsg");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText("8310708591.kvb@ybl").then(() => {
        if (copyMsg) {
          copyMsg.style.display = "inline";
          setTimeout(() => (copyMsg.style.display = "none"), 1400);
        }
      });
    });
  }

  // Set form action from config!
  const form =
    document.getElementById("bookingForm") || document.querySelector("form");
  if (form) {
    form.action = ENDPOINT_SUBMIT;
  }

  // 1. Autofill fields from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionID = urlParams.get("user_sessionID") || "";
  const waNumber = urlParams.get("user_wa_number") || "";
  const userName = urlParams.get("user_name") || "";
  const sessionInput = document.querySelector('input[name="SessionID"]');
  if (sessionInput) sessionInput.value = sessionID;
  const phoneInput = document.querySelector('input[name="Phone Number"]');
  if (phoneInput) phoneInput.value = waNumber;
  const nameInput = document.querySelector('input[name="Full Name"]');
  if (nameInput) nameInput.value = userName;

  // 2. Load slots into dropdown
  const slotLabelMap = {};
  async function loadAvailableSlots() {
    try {
      const response = await fetch(ENDPOINT_SLOTS);
      const data = await response.json();
      const slotSelect = document.getElementById("BookSlot");
      slotSelect.innerHTML = '<option value="">Select a slot</option>';
      data.forEach((slot) => {
        const option = document.createElement("option");
        option.value = slot.value;
        option.textContent = slot.label;
        slotLabelMap[slot.value] = slot.label;
        slotSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Failed to load slots:", err);
      const slotSelect = document.getElementById("BookSlot");
      if (slotSelect)
        slotSelect.innerHTML = '<option value="">No slots available</option>';
    }
  }
  loadAvailableSlots();

  // 3. Hidden readable slot
  if (form) {
    const hiddenReadable = document.createElement("input");
    hiddenReadable.type = "hidden";
    hiddenReadable.name = "Readable Slot";
    hiddenReadable.id = "ReadableSlot";
    form.appendChild(hiddenReadable);
    document.getElementById("BookSlot").addEventListener("change", (e) => {
      const selectedId = e.target.value;
      document.getElementById("ReadableSlot").value =
        slotLabelMap[selectedId] || "";
    });
  }

  // 4. Eligibility check on page load (before user can interact)
  (async function () {
    if (waNumber && sessionID) {
      try {
        const res = await fetch(
          ENDPOINT_VALIDATE +
            "?user_wa_number=" +
            encodeURIComponent(waNumber) +
            "&user_sessionID=" +
            encodeURIComponent(sessionID)
        );
        const data = await res.json();
        if (data && data.allowed === false) {
          let expiredParams = new URLSearchParams();
          if (data.name) expiredParams.set("name", data.name);
          if (data.slot) expiredParams.set("slot", data.slot);
          if (data.waitDate) expiredParams.set("waitDate", data.waitDate);
          if (data.message) expiredParams.set("msg", data.message);
          window.location.href = "/expired.html?" + expiredParams.toString();
        }
      } catch (e) {
        console.warn("Eligibility API failed", e);
      }
    }
  })();

  // 5. Prevent rapid resubmits (disable submit button during submission)
  if (form) {
    form.addEventListener("submit", function (e) {
      const btn = document.getElementById("bookBtn");
      if (btn) btn.disabled = true;
      setTimeout(() => {
        if (btn) btn.disabled = false;
      }, 7000);
    });
  }
});
