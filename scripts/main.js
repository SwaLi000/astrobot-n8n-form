// ========== Config ==============
const ENDPOINT_SUBMIT = "https://bot.tinkerwithswaroop.live/webhook/form";
const ENDPOINT_CANCEL ="https://bot.tinkerwithswaroop.live/webhook/cancellation";
const ENDPOINT_SLOTS = "https://bot.tinkerwithswaroop.live/webhook/form";
const ENDPOINT_VALIDATE ="https://bot.tinkerwithswaroop.live/webhook/form/validate";
// ================================

function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

document.addEventListener("DOMContentLoaded", function () {
  // UPI Pay section (Booking form only)
  const upiBtn = document.getElementById("upiPayBtn");
  const desktopMsg = document.getElementById("upiDesktopMsg");
  if (isMobile()) {
    if (upiBtn) upiBtn.style.display = "inline-block";
    if (desktopMsg) desktopMsg.style.display = "none";
  } else {
    if (upiBtn) upiBtn.style.display = "none";
    if (desktopMsg) desktopMsg.style.display = "block";
  }

  // Copy UPI ID
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

  // Determine which form is being used
  const bookingForm = document.getElementById("bookingForm");
  const cancellationForm = document.getElementById("cancellationForm");
  let form = bookingForm || cancellationForm;
  if (!form) return;

  // Set correct endpoint
  if (form === bookingForm) {
    form.action = ENDPOINT_SUBMIT;
  } else if (form === cancellationForm) {
    form.action = ENDPOINT_CANCEL;
  }

  // URL Params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionID = urlParams.get("user_sessionID") || "";
  const waNumber = urlParams.get("user_wa_number") || "";
  const userName = urlParams.get("user_name") || "";
  const userEmail = urlParams.get("user_email") || "";
  const bookedInfo = urlParams.get("Booked Info") || "";

  // === Booking Form Logic ===
  if (bookingForm) {
    const sessionInput = bookingForm.querySelector('input[name="SessionID"]');
    const phoneInput = bookingForm.querySelector('input[name="Phone Number"]');
    const nameInput = bookingForm.querySelector('input[name="Full Name"]');
    const emailInput = bookingForm.querySelector('input[name="Email"]');

    if (sessionInput) sessionInput.value = sessionID;
    if (phoneInput) phoneInput.value = waNumber;
    if (nameInput) nameInput.value = userName;
    if (emailInput) emailInput.value = userEmail;

    const slotLabelMap = {};
    async function loadAvailableSlots() {
      try {
        const response = await fetch(ENDPOINT_SLOTS);
        const data = await response.json();
        const slotSelect = document.getElementById("BookSlot");
        if (!slotSelect) return;
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
        if (slotSelect) {
          slotSelect.innerHTML = '<option value="">No slots available</option>';
        }
      }
    }
    loadAvailableSlots();

    // Add hidden readable slot
    const hiddenReadableExists =
      !!bookingForm.querySelector("input#ReadableSlot");
    if (!hiddenReadableExists) {
      const hiddenReadable = document.createElement("input");
      hiddenReadable.type = "hidden";
      hiddenReadable.name = "Readable Slot";
      hiddenReadable.id = "ReadableSlot";
      bookingForm.appendChild(hiddenReadable);
    }

    const bookSlotElt = document.getElementById("BookSlot");
    if (bookSlotElt) {
      bookSlotElt.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        document.getElementById("ReadableSlot").value =
          slotLabelMap[selectedId] || "";
      });
    }

    // Eligibility check
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
  }

  // === Cancellation Form Logic ===
  if (cancellationForm) {
    const nameInput = cancellationForm.querySelector('input[name="Full Name"]');
    const phoneInput = cancellationForm.querySelector(
      'input[name="Phone Number"]'
    );
    const sessionInput = cancellationForm.querySelector(
      'input[name="SessionID"]'
    );
    const bookedInfoInput = cancellationForm.querySelector(
      'input[name="Booked Info"]'
    );

    if (nameInput) {
      nameInput.value = userName;
      nameInput.setAttribute("readonly", "readonly");
      nameInput.setAttribute("tabindex", "-1");
    }
    if (phoneInput) {
      phoneInput.value = waNumber;
      phoneInput.setAttribute("readonly", "readonly");
      phoneInput.setAttribute("tabindex", "-1");
    }
    if (sessionInput) {
      sessionInput.value = sessionID;
    }
    if (bookedInfoInput) {
      bookedInfoInput.value = bookedInfo;
      bookedInfoInput.setAttribute("readonly", "readonly");
      bookedInfoInput.setAttribute("tabindex", "-1");
    }
  }

  // Submit button disable (all forms)
  if (form) {
    form.addEventListener("submit", function () {
      let btnId = "bookBtn";
      if (cancellationForm) btnId = "cancelBtn";
      const btn = document.getElementById(btnId);
      if (btn) btn.disabled = true;
      setTimeout(() => {
        if (btn) btn.disabled = false;
      }, 7000);
    });
  }
});
