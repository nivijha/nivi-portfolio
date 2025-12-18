const form = document.getElementById("contact-form");
const statusText = document.getElementById("contact-status");
const submitBtn = form.querySelector(".contact-btn");

// Get fields safely
const nameInput = form.elements["name"];
const emailInput = form.elements["email"];
const messageInput = form.elements["message"];
const honeypot = form.elements["company"];

/* ----------------------------
   Enable / Disable button logic
----------------------------- */
function validateForm() {
  const isValid =
    nameInput.value.trim() &&
    emailInput.validity.valid &&
    messageInput.value.trim();

  submitBtn.disabled = !isValid;
}

// Run validation on input
[nameInput, emailInput, messageInput].forEach((field) => {
  field.addEventListener("input", validateForm);
});

/* ----------------------------
   Submit handler
----------------------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Honeypot check
  if (honeypot.value) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  statusText.textContent = "";

  const data = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    message: messageInput.value.trim(),
  };

  try {
    const res = await fetch(
      "https://1emm8cvh74.execute-api.us-east-1.amazonaws.com/contact",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    if (res.ok) {
      statusText.textContent = "Message sent successfully!";
      statusText.style.color = "#22c55e";
      form.reset();
    } else {
      statusText.textContent = "Something went wrong!";
      statusText.style.color = "#ef4444";
    }
  } catch (err) {
    statusText.textContent = "Server error! Please try again.";
    statusText.style.color = "#ef4444";
  } finally {
    submitBtn.textContent = "Send Message →";
    validateForm(); // re-check after reset
  }
});
