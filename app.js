
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);

  const icons = {
    Electronics: "🎧",
    Bags: "🎒",
    Keys: "🔑",
    Accessories: "🧢",
    "Books & Notes": "📚",
    Clothing: "🧣",
    "IDs & Cards": "🪪",
    Other: "📦"
  };

  const statusClass = status =>
    "status-" + String(status || "Lost").toLowerCase();

  const formatDate = date => {
    if (!date) return "Date not set";

    const d = new Date(date + "T12:00:00");

    return Number.isNaN(d.getTime())
      ? date
      : d.toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
  };

  const imageOrEmoji = item => {
    if (
      typeof item.image === "string" &&
      item.image.startsWith("data:image/")
    ) {
      return `
        <img
          class="item-photo"
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.title || "Item photo")}"
          style="width:100%;height:100%;object-fit:cover;"
        >
      `;
    }

    return `<span class="item-emoji">${icons[item.category] || "📦"}</span>`;
  };

  const badge = status =>
    `<span class="status-badge ${statusClass(status)}">${escapeHTML(status)}</span>`;

  const card = item => `
    <article class="item-card">
      <a href="item-details.html?id=${encodeURIComponent(item.id)}">
        <div class="item-visual">
          ${imageOrEmoji(item)}
          ${badge(item.status)}
        </div>
      </a>

      <div class="item-content">
        <div class="item-meta">
          <span>${escapeHTML(item.category)}</span>
          <span>${formatDate(item.date)}</span>
        </div>

        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description)}</p>

        <div class="item-footer">
          <span class="item-location">⌖ ${escapeHTML(item.location)}</span>
          <a class="item-link"
             href="item-details.html?id=${encodeURIComponent(item.id)}">
            View details →
          </a>
        </div>
      </div>
    </article>
  `;

  function showToast(message) {
    let toast = $("#toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.remove(), 3200);
  }

  function setupDarkMode() {
    const btn = $("#darkModeToggle");
    if (!btn) return;

    const currentTheme =
      localStorage.getItem("campusfind_theme") || "light";

    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    btn.textContent = currentTheme === "dark" ? "☀️" : "🌙";

    btn.addEventListener("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";

      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("campusfind_theme", "light");
        btn.textContent = "🌙";
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("campusfind_theme", "dark");
        btn.textContent = "☀️";
      }
    });
  }

  function setupTabs() {
    const homeView = $("#homeView");
    const reportsView = $("#reportsView");
    const navHome = $("#navHome");
    const navReports = $("#navReports");

    if (!homeView || !reportsView || !navHome || !navReports) return;

    navHome.addEventListener("click", e => {
      e.preventDefault();

      homeView.classList.remove("hidden");
      reportsView.classList.add("hidden");
      navHome.classList.add("active");
      navReports.classList.remove("active");

      history.pushState({}, "", "index.html");
    });

    navReports.addEventListener("click", e => {
      e.preventDefault();

      reportsView.classList.remove("hidden");
      homeView.classList.add("hidden");
      navReports.classList.add("active");
      navHome.classList.remove("active");

      renderReports();
      history.pushState({}, "", "#reports");
    });

    if (location.hash === "#reports") {
      navReports.click();
    }
  }

  function renderHome() {
    const grid = $("#itemsGrid");
    if (!grid) return;

    let activeType = "All";

    const render = () => {
      const reports = CampusStore.getAll();

      $("#statTotal").textContent = reports.length;

      $("#statFound").textContent = reports.filter(
        x =>
          x.kind === "Found" ||
          ["Found", "Claimed", "Returned"].includes(x.status)
      ).length;

      $("#statReturned").textContent = reports.filter(
        x => x.status === "Returned"
      ).length;

      $("#allCount").textContent = reports.length;

      const q = ($("#searchInput")?.value || "").trim().toLowerCase();
      const category = $("#categoryFilter")?.value || "";
      const status = $("#statusFilter")?.value || "";

      const result = reports.filter(x => {
        const text = [
          x.title,
          x.description,
          x.location,
          x.category
        ].join(" ").toLowerCase();

        return (
          (!q || text.includes(q)) &&
          (!category || x.category === category) &&
          (!status || x.status === status) &&
          (
            activeType === "All" ||
            (
              activeType === "Lost" &&
              x.kind === "Lost" &&
              x.status !== "Returned"
            ) ||
            (
              activeType === "Found" &&
              x.kind === "Found" &&
              x.status !== "Returned"
            ) ||
            (
              activeType === "Returned" &&
              x.status === "Returned"
            )
          )
        );
      });

      grid.innerHTML = result.map(card).join("");

      const emptyState = $("#emptyState");
      if (emptyState) {
        emptyState.classList.toggle("hidden", result.length > 0);
      }
    };

    ["searchInput", "categoryFilter", "statusFilter"].forEach(id => {
      const element = $("#" + id);
      if (!element) return;

      element.addEventListener(
        id === "searchInput" ? "input" : "change",
        render
      );
    });

    $$("#typeTabs [data-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        $$("#typeTabs [data-type]").forEach(b => {
          b.classList.remove("active");
        });

        btn.classList.add("active");
        activeType = btn.dataset.type;
        render();
      });
    });

    const clearBtn = $("#clearFilters");

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if ($("#searchInput")) $("#searchInput").value = "";
        if ($("#categoryFilter")) $("#categoryFilter").value = "";
        if ($("#statusFilter")) $("#statusFilter").value = "";

        activeType = "All";

        $$("#typeTabs [data-type]").forEach(btn => {
          btn.classList.toggle("active", btn.dataset.type === "All");
        });

        render();
      });
    }

    render();
  }

  // --------------------------------------------------
  // REPORT FORM
  // --------------------------------------------------

  function setupReportForm() {
    const form = $("#reportForm");
    if (!form) return;

    const dateInput = form.elements.namedItem("date");
    const imageInput = form.elements.namedItem("image");

    let imagePreview = $("#imagePreview");

    if (imageInput && !imagePreview) {
      imagePreview = document.createElement("img");
      imagePreview.id = "imagePreview";
      imagePreview.alt = "Item photo preview";
      imagePreview.hidden = true;

      imagePreview.style.cssText = `
        display: none;
        width: 100%;
        max-width: 320px;
        max-height: 250px;
        object-fit: contain;
        margin-top: 12px;
        border-radius: 12px;
      `;

      imageInput.insertAdjacentElement("afterend", imagePreview);
    }

    let selectedImage = "";

    if (dateInput) {
      dateInput.max = new Date().toISOString().slice(0, 10);

      if (!dateInput.value) {
        dateInput.value = dateInput.max;
      }
    }

    if (imageInput && imagePreview) {
      imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        selectedImage = "";

        imagePreview.removeAttribute("src");
        imagePreview.style.display = "none";
        imagePreview.hidden = true;

        if (!file) return;

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
          showToast("Please upload a JPG, PNG, or WEBP image.");
          imageInput.value = "";
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          showToast("Image must not exceed 2 MB.");
          imageInput.value = "";
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result !== "string") {
            showToast("Could not read the selected image.");
            imageInput.value = "";
            return;
          }

          selectedImage = reader.result;
          imagePreview.src = selectedImage;
          imagePreview.hidden = false;
          imagePreview.style.display = "block";
        };

        reader.onerror = () => {
          selectedImage = "";
          imageInput.value = "";
          showToast("Could not read the selected image.");
        };

        reader.readAsDataURL(file);
      });
    }

    form.addEventListener("submit", event => {
      event.preventDefault();

      const message = $("#formMessage");

      if (message) {
        message.textContent = "";
        message.classList.remove("error");
      }

      if (!form.reportValidity()) {
        if (message) {
          message.textContent = "Please complete all required fields.";
          message.classList.add("error");
        }
        return;
      }

      if (imageInput && imageInput.files.length > 0 && !selectedImage) {
        showToast("Please wait for the image preview to finish loading.");
        return;
      }

      const data = new FormData(form);
      const kind = form.dataset.kind;

      // Verification fields added to found.html.
      const verificationQuestion = String(
        data.get("verificationQuestion") || ""
      ).trim();

      const verificationAnswer = String(
        data.get("verificationAnswer") || ""
      ).trim();

      // Found reports must have a verification question and answer.
      if (
        kind === "Found" &&
        (!verificationQuestion || !verificationAnswer)
      ) {
        if (message) {
          message.textContent =
            "Please add an ownership verification question and answer.";
          message.classList.add("error");
        } else {
          showToast("Please add the verification question and answer.");
        }
        return;
      }

      const report = {
        id: "item-" + Date.now() + "-" +
          Math.random().toString(36).slice(2, 7),

        title: String(data.get("title") || "").trim(),
        category: String(data.get("category") || "Other"),
        kind,
        status: kind,
        date: String(data.get("date") || ""),
        description: String(data.get("description") || "").trim(),
        location: String(data.get("location") || "").trim(),
        contact: String(data.get("contact") || "").trim(),
        contactInfo: String(data.get("contactInfo") || "").trim(),

        image: selectedImage,

        // These fields are used by the demo ownership check.
        verificationQuestion:
          kind === "Found" ? verificationQuestion : "",
        verificationAnswer:
          kind === "Found" ? verificationAnswer : "",

        // Claim details are empty until someone claims the item.
        claimVerified: false,
        claimName: "",
        claimContact: "",

        createdAt: Date.now()
      };

      try {
        CampusStore.add(report);

        window.location.href =
          "item-details.html?id=" +
          encodeURIComponent(report.id) +
          "&created=1";
      } catch (err) {
        console.error("Could not save report:", err);

        if (message) {
          message.textContent =
            "Could not save report. The image may be too large for browser storage.";
          message.classList.add("error");
        } else {
          showToast("Could not save report. Try a smaller image.");
        }
      }
    });
  }

  // --------------------------------------------------
  // ITEM DETAILS + OWNERSHIP VERIFICATION
  // --------------------------------------------------

  function renderDetails() {
    const root = $("#detailsContent");
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const item = CampusStore.getById(id);

    if (!item) {
      root.innerHTML = `
        <div class="empty-state">
          <div>🧐</div>
          <h3>We couldn't find that report</h3>
          <a class="button button-primary" href="index.html">
            Back to home
          </a>
        </div>
      `;
      return;
    }

    const isFound = item.kind === "Found";
    const hasVerification = Boolean(
      item.verificationQuestion && item.verificationAnswer
    );

    let verificationSection = "";

    if (isFound && item.status === "Returned") {
      verificationSection = `
        <section class="contact-panel">
          <h3>✓ Item Returned</h3>
          <p>This item has been marked as returned.</p>
        </section>
      `;
    } else if (isFound && item.status === "Claimed") {
      verificationSection = `
        <section class="contact-panel">
          <h3>✓ Ownership Check Passed</h3>
          <p>
            A claimant has answered the verification question correctly.
            Contact the finder to arrange a safe handover.
          </p>
          ${
            item.claimName
              ? `<p><strong>Claimant:</strong> ${escapeHTML(item.claimName)}</p>`
              : ""
          }
          ${
            item.claimContact
              ? `<p><strong>Claimant contact:</strong> ${escapeHTML(item.claimContact)}</p>`
              : ""
          }
        </section>
      `;
    } else if (isFound && hasVerification) {
      verificationSection = `
        <section class="contact-panel" style="margin-top:20px;">
          <h3>🔐 Ownership Verification</h3>
          <p>
            Answer the question to help verify that this item belongs to you.
          </p>

          <div style="margin:14px 0;">
            <strong>${escapeHTML(item.verificationQuestion)}</strong>
          </div>

          <form id="claimForm">
            <label for="claimName">Your name</label>
            <input
              id="claimName"
              name="claimName"
              type="text"
              maxlength="100"
              required
              autocomplete="name"
              style="width:100%;margin:6px 0 12px;"
            >

            <label for="claimContact">Your contact information</label>
            <input
              id="claimContact"
              name="claimContact"
              type="text"
              maxlength="150"
              required
              autocomplete="off"
              placeholder="Email or phone"
              style="width:100%;margin:6px 0 12px;"
            >

            <label for="claimAnswer">Your answer</label>
            <input
              id="claimAnswer"
              name="claimAnswer"
              type="password"
              maxlength="150"
              required
              autocomplete="off"
              style="width:100%;margin:6px 0 12px;"
            >

            <p id="claimMessage" aria-live="polite"></p>

            <button class="button button-primary" type="submit">
              Verify ownership
            </button>
          </form>

          <p style="font-size:13px;margin-top:12px;">
            If your answer is correct, coordinate with the finder to collect
            the item. The item is not automatically marked as returned.
          </p>
        </section>
      `;
    } else if (isFound && !hasVerification) {
      verificationSection = `
        <section class="contact-panel" style="margin-top:20px;">
          <h3>Ownership Verification Unavailable</h3>
          <p>
            This report does not have a verification question, so ownership
            cannot be checked through this demo form.
          </p>
        </section>
      `;
    }

    const canMarkReturned =
      item.status !== "Returned" &&
      (!isFound || item.status === "Claimed");

    root.innerHTML = `
      <div class="details-layout">
        <div class="details-visual">
          ${imageOrEmoji(item)}
          ${badge(item.status)}
        </div>

        <div class="details-copy">
          <span class="eyebrow">
            ${escapeHTML(item.kind)} ITEM ·
            ${escapeHTML(String(item.category || "Other").toUpperCase())}
          </span>

          <h1>${escapeHTML(item.title)}</h1>

          <p class="details-description">
            ${escapeHTML(item.description)}
          </p>

          <div class="detail-facts">
            <div class="detail-fact">
              <span>📍 Location</span>
              <strong>${escapeHTML(item.location)}</strong>
            </div>

            <div class="detail-fact">
              <span>📅 Date</span>
              <strong>${formatDate(item.date)}</strong>
            </div>
          </div>

          <div class="contact-panel">
            <h3>Contact Details</h3>
            <p>
              ${escapeHTML(item.contact)} ·
              ${escapeHTML(item.contactInfo)}
            </p>
          </div>

          ${verificationSection}

          <div class="detail-actions" style="margin-top:20px;">
            ${
              canMarkReturned
                ? `<button class="button button-primary" id="markReturned">
                     ✓ Mark as returned
                   </button>`
                : ""
            }

            <a class="button button-light" href="index.html">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    `;

    // Verify the claimant's answer.
    const claimForm = $("#claimForm");

    if (claimForm) {
      claimForm.addEventListener("submit", event => {
        event.preventDefault();

        const claimMessage = $("#claimMessage");
        const formData = new FormData(claimForm);

        const answer = String(formData.get("claimAnswer") || "").trim();
        const claimantName = String(formData.get("claimName") || "").trim();
        const claimantContact = String(
          formData.get("claimContact") || ""
        ).trim();

        if (!answer || !claimantName || !claimantContact) {
          if (claimMessage) {
            claimMessage.textContent = "Please complete all fields.";
            claimMessage.classList.add("error");
          }
          return;
        }

        // Case-insensitive comparison, ignoring outer whitespace.
        const normalizeAnswer = value =>
          String(value || "").trim().toLocaleLowerCase();

        if (
          normalizeAnswer(answer) !==
          normalizeAnswer(item.verificationAnswer)
        ) {
          if (claimMessage) {
            claimMessage.textContent =
              "That answer does not match. Please check your answer and try again.";
            claimMessage.classList.add("error");
          }
          return;
        }

        try {
          CampusStore.update(item.id, {
            status: "Claimed",
            claimVerified: true,
            claimName: claimantName,
            claimContact: claimantContact,
            claimedAt: Date.now()
          });

          showToast("Verification passed. Contact the finder to arrange handover.");
          renderDetails();
        } catch (err) {
          console.error("Could not save claim:", err);

          if (claimMessage) {
            claimMessage.textContent =
              "Could not save your claim. Please try again.";
            claimMessage.classList.add("error");
          }
        }
      });
    }

    // Only allow a Found report to be marked returned after verification.
    const returnedBtn = $("#markReturned");

    if (returnedBtn) {
      returnedBtn.addEventListener("click", () => {
        if (
          item.kind === "Found" &&
          item.status !== "Claimed"
        ) {
          showToast("Verify ownership before marking this item returned.");
          return;
        }

        if (confirm("Mark this item as returned?")) {
          CampusStore.update(item.id, {
            status: "Returned",
            returnedAt: Date.now()
          });

          showToast("Status updated.");
          renderDetails();
        }
      });
    }

    if (params.get("created") === "1") {
      showToast("Report published successfully!");
    }
  }

  // --------------------------------------------------
  // MY REPORTS / REPORT MANAGEMENT
  // --------------------------------------------------

  function renderReports() {
    const list = $("#reportsList");
    if (!list) return;

    const items = CampusStore.getAll();
    const summary = $("#reportSummary");

    if (summary) {
      summary.innerHTML = [
        ["Total", items.length],
        [
          "Lost",
          items.filter(x =>
            x.kind === "Lost" && x.status !== "Returned"
          ).length
        ],
        [
          "Found",
          items.filter(x =>
            x.kind === "Found" && x.status !== "Returned"
          ).length
        ],
        [
          "Returned",
          items.filter(x => x.status === "Returned").length
        ]
      ].map(([label, count]) => `
        <div class="summary-card">
          <span>${label}</span>
          <strong>${count}</strong>
        </div>
      `).join("");
    }

    list.innerHTML = items.map(item => `
      <article class="report-row">
        <div class="report-thumb">
          ${imageOrEmoji(item)}
        </div>

        <div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>

          <div class="row-meta">
            <span>⌖ ${escapeHTML(item.location)}</span>
            <span>📅 ${formatDate(item.date)}</span>
          </div>

          ${
            item.kind === "Found" && item.status === "Claimed"
              ? `<p style="margin-top:8px;">
                   ✓ Ownership answer matched. Arrange handover with the claimant.
                 </p>`
              : ""
          }
        </div>

        <div class="row-actions">
          ${badge(item.status)}

          <select class="small-select status-select"
                  data-id="${escapeHTML(item.id)}">
            <option value="Lost" ${item.status === "Lost" ? "selected" : ""}>Lost</option>
            <option value="Found" ${item.status === "Found" ? "selected" : ""}>Found</option>
            <option value="Claimed" ${item.status === "Claimed" ? "selected" : ""}>Claimed</option>
            <option value="Returned" ${item.status === "Returned" ? "selected" : ""}>Returned</option>
          </select>

          <a class="item-link"
             href="item-details.html?id=${encodeURIComponent(item.id)}">
            View details
          </a>

          <button class="delete-button"
                  data-delete="${escapeHTML(item.id)}">
            Delete
          </button>
        </div>
      </article>
    `).join("");

    const emptyState = $("#reportsEmpty");

    if (emptyState) {
      emptyState.classList.toggle("hidden", items.length > 0);
    }

    $$(".status-select", list).forEach(sel => {
      sel.addEventListener("change", () => {
        const report = CampusStore.getById(sel.dataset.id);
        if (!report) return;

        // Prevent bypassing the verification step for Found reports.
        if (
          report.kind === "Found" &&
          sel.value === "Returned" &&
          report.status !== "Claimed" &&
          report.status !== "Returned"
        ) {
          showToast("A Found item must pass ownership verification before being returned.");
          renderReports();
          return;
        }

        if (
          report.kind === "Found" &&
          sel.value === "Claimed" &&
          !report.claimVerified
        ) {
          showToast("Use the ownership verification form to claim this item.");
          renderReports();
          return;
        }

        CampusStore.update(report.id, { status: sel.value });
        showToast("Status updated");
        renderReports();
      });
    });

    $$("[data-delete]", list).forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Delete report?")) {
          CampusStore.remove(btn.dataset.delete);
          showToast("Deleted");
          renderReports();
        }
      });
    });

    const resetBtn = $("#resetDemo");

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = "true";

      resetBtn.addEventListener("click", () => {
        if (confirm("Reset demo?")) {
          CampusStore.reset();
          showToast("Restored");
          renderReports();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupDarkMode();
    setupTabs();
    renderHome();
    setupReportForm();
    renderDetails();
    renderReports();
  });
})();
