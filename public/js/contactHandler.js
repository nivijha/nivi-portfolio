(() => {
  // Guard: only run on contact page
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusText = document.getElementById("contact-status");
  const submitBtn = form.querySelector(".contact-btn");

  const nameInput = form.elements["name"];
  const emailInput = form.elements["email"];
  const messageInput = form.elements["message"];
  const honeypot = form.elements["company"];

  if (!statusText || !submitBtn || !nameInput || !emailInput || !messageInput) {
    console.warn("Contact form elements missing. Script aborted.");
    return;
  }

  /* ----------------------------
     Enable / Disable Submit
  -----------------------------*/
  function validateForm() {
    const isValid =
      nameInput.value.trim().length > 0 &&
      emailInput.validity.valid &&
      messageInput.value.trim().length > 0;

    submitBtn.disabled = !isValid;
  }

  [nameInput, emailInput, messageInput].forEach(field =>
    field.addEventListener("input", validateForm)
  );

  validateForm();

  /* ----------------------------
     Submit Handler
  -----------------------------*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot → silently ignore bots
    if (honeypot && honeypot.value) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    statusText.textContent = "";
    statusText.style.color = "";

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
    };

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      // Success
      statusText.textContent = "Message sent successfully!";
      statusText.style.color = "#22c55e";
      form.reset();
      validateForm();
    } catch (err) {
      // console.error("Contact form error:", err);

      statusText.textContent =
        "Something went wrong. Please try again later.";
      statusText.style.color = "#ef4444";
    } finally {
      submitBtn.textContent = "Send Message →";
    }
  });
})();
