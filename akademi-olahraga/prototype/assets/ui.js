/* Arenaku prototype interactions */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Icons ---------- */
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  window.toast = function (message) {
    let el = $("#global-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<i data-lucide="check"></i><span></span>';
    $("span", el).textContent = message;
    renderIcons();
    el.style.display = "flex";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.display = "none";
    }, 2600);
  };

  /* ---------- Tabs ---------- */
  function initTabs() {
    $$("[data-tabs]").forEach((bar) => {
      const scope = bar.closest(".tabbed") || document;
      const buttons = $$("[data-tab]", bar);
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-tab");
          buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
          $$("[data-panel]", scope).forEach((panel) => {
            panel.classList.toggle("is-active", panel.getAttribute("data-panel") === key);
          });
        });
      });
      // activate first if none active
      if (!buttons.some((b) => b.classList.contains("is-active")) && buttons[0]) {
        buttons[0].click();
      }
    });
  }

  /* ---------- Modals ---------- */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const first = $("input, select, textarea, button", modal);
    if (first) setTimeout(() => first.focus(), 50);
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  function initModals() {
    $$("[data-modal-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(btn.getAttribute("data-modal-open"));
      });
    });
    $$(".modal").forEach((modal) => {
      $$("[data-modal-close]", modal).forEach((btn) =>
        btn.addEventListener("click", () => closeModal(modal))
      );
      const backdrop = $(".modal-backdrop", modal);
      if (backdrop) backdrop.addEventListener("click", () => closeModal(modal));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") $$(".modal").forEach((m) => closeModal(m));
    });
  }

  /* ---------- Table filter ---------- */
  function initFilters() {
    $$("[data-filter]").forEach((input) => {
      const target = $(input.getAttribute("data-filter"));
      if (!target) return;
      const rows = target.querySelector("tbody")
        ? $$("tbody tr", target).filter((r) => !r.hasAttribute("data-static"))
        : Array.from(target.children);
      input.addEventListener("input", () => {
        const q = input.value.toLowerCase().trim();
        rows.forEach((row) => {
          row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    });
  }

  /* ---------- Select all ---------- */
  function initSelectAll() {
    $$("[data-check-all]").forEach((master) => {
      const scope = master.closest("table") || document;
      master.addEventListener("change", () => {
        $$('tbody input[type="checkbox"]', scope).forEach((cb) => {
          cb.checked = master.checked;
        });
      });
    });
  }

  /* ---------- Attendance ---------- */
  function initAttendance() {
    const list = $("[data-attendance]");
    if (list) {
      const rows = $$(".att-row", list);
      const max = rows.length;

      function updateSummary() {
        const counts = { present: 0, late: 0, permitted: 0, sick: 0, absent: 0 };
        rows.forEach((row) => {
          const on = $(".att-btn.is-on", row);
          if (on) counts[on.getAttribute("data-status")] = (counts[on.getAttribute("data-status")] || 0) + 1;
        });
        Object.keys(counts).forEach((key) => {
          $$('[data-count="' + key + '"]').forEach((el) => (el.textContent = counts[key]));
        });
        $$('[data-count="total"]').forEach((el) => (el.textContent = max));
        const attended = counts.present + counts.late;
        $$('[data-count="attended"]').forEach((el) => (el.textContent = attended));
        $$('[data-att-progress]').forEach((bar) => {
          bar.style.width = max ? Math.round((attended / max) * 100) + "%" : "0%";
        });
      }

      rows.forEach((row) => {
        $$(".att-btn", row).forEach((btn) => {
          btn.addEventListener("click", () => {
            const already = btn.classList.contains("is-on");
            $$(".att-btn", row).forEach((b) => {
              b.classList.remove("is-on");
              b.setAttribute("aria-pressed", "false");
            });
            if (!already) {
              btn.classList.add("is-on");
              btn.setAttribute("aria-pressed", "true");
            }
            updateSummary();
          });
        });
      });

      const markAll = $("[data-att-all]");
      if (markAll) {
        markAll.addEventListener("click", () => {
          rows.forEach((row) => {
            const btn = $('.att-btn[data-status="present"]', row);
            if (btn) {
              $$(".att-btn", row).forEach((b) => b.classList.remove("is-on"));
              btn.classList.add("is-on");
            }
          });
          updateSummary();
          window.toast("Semua member ditandai hadir");
        });
      }
      updateSummary();
    }
  }

  /* ---------- Mark paid demo ---------- */
  function initPayments() {
    $$("[data-mark-paid]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const row = btn.closest("tr");
        if (row) {
          const badge = $(".js-pay-status", row);
          if (badge) {
            badge.className = "badge badge-green js-pay-status";
            badge.innerHTML = '<span class="dot"></span>Lunas';
          }
          $$("[data-mark-paid]", row).forEach((b) => b.remove());
        }
        window.toast("Pembayaran ditandai lunas");
      });
    });
  }

  /* ---------- Cost / income split demo ---------- */
  function initDisabledLinks() {
    $$('a[href="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (a.hasAttribute("data-demo")) window.toast("Ini prototype — aksi tidak dijalankan");
      });
    });
  }

  /* ---------- Sidebar mobile ---------- */
  function initSidebar() {
    const toggle = $("[data-sidebar-toggle]");
    const sidebar = $(".sidebar");
    if (toggle && sidebar) {
      toggle.addEventListener("click", () => sidebar.classList.toggle("is-open"));
    }
  }

  /* ---------- Live clock for demo headers ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderIcons();
    initTabs();
    initModals();
    initFilters();
    initSelectAll();
    initAttendance();
    initPayments();
    initDisabledLinks();
    initSidebar();
  });

  // Render icons again after dynamic content
  window.addEventListener("load", renderIcons);
})();
