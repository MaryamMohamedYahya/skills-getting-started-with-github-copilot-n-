document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and activity select/options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Choose an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with unregister button
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          const items = details.participants
            .map((p) => {
              // derive initials from participant string (email or name)
              const base = (p || "").split("@")[0].trim();
              const parts = base.split(/[\s._-]+/).filter(Boolean);
              const initials =
                (parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] + (parts[1] ? parts[1][0] : ""))).toUpperCase();
              return `<li data-email="${p}" data-activity="${name}"><span class="participant-badge">${initials}</span><span class="participant-name">${p}</span><button class="participant-delete" title="Unregister participant">✖</button></li>`;
            })
            .join("");
          participantsHtml = `<div class="participants"><h5>Participants</h5><ul>${items}</ul></div>`;
        } else {
          participantsHtml = `<div class="participants empty">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities so participants list updates (avoid cached responses)
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Click handler for unregister (delegated) — removes a participant from an activity
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest && e.target.closest(".participant-delete");
    if (!btn) return;
    const li = btn.closest("li");
    if (!li) return;
    const email = li.dataset.email;
    const activity = li.dataset.activity;
    if (!email || !activity) return;
    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await res.json();
      if (res.ok) {
        messageDiv.textContent = result.message || "Participant unregistered";
        messageDiv.className = "success";
        // refresh activities list (ensure we wait for fresh data)
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });
});
