// ==========================================
// Administration page
// ==========================================
// Not linked from the public site: only an account signed up as an
// administrator can open /admin, and every API call is checked again
// on the server.

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");

const themeColorMeta = document.getElementById("themeColor");

const THEME_KEY = "eco-theme";


function applyTheme(theme) {

    root.setAttribute("data-theme", theme);

    if (themeColorMeta) {
        themeColorMeta.setAttribute(
            "content",
            theme === "dark" ? "#0d1511" : "#14532d"
        );
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
        );
    }

}


const savedTheme =
    localStorage.getItem(THEME_KEY) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

applyTheme(savedTheme);


if (themeToggle) {

    themeToggle.addEventListener("click", function () {

        const next =
            root.getAttribute("data-theme") === "dark" ? "light" : "dark";

        localStorage.setItem(THEME_KEY, next);

        applyTheme(next);

    });

}


// ------------------------------------------
// Helpers
// ------------------------------------------

const STATUSES = ["Pending", "In Progress", "Resolved"];

const CATEGORY_LABELS = {
    waste: ["🗑️", "Waste"],
    garbage: ["🗑️", "Waste"],
    water: ["💧", "Water Pollution"],
    road: ["🛣️", "Road Cleanliness"],
    air: ["🌫️", "Air Pollution"],
    noise: ["🔇", "Noise Pollution"],
    green: ["🌳", "Green Cover"],
    other: ["📎", "Other"]
};


function escapeHtml(value) {

    return String(value == null ? "" : value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#39;");

}


function formatDate(value) {

    if (!value) return "";

    const parts = String(value).split(" ");

    const date = parts[0].split("-");

    if (date.length !== 3) return value;

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = months[parseInt(date[1], 10) - 1] || "";

    return parseInt(date[2], 10) + " " + month + " " + date[0] +
        (parts[1] ? ", " + parts[1].slice(0, 5) : "");

}


function statusClass(status) {
    if (status === "Resolved") return "is-resolved";

    if (status === "In Progress") return "is-progress";

    return "is-pending";
}


function setCounts(counts) {

    document.querySelectorAll(".stat-value").forEach(function (element) {

        const key = element.getAttribute("data-stat");

        element.textContent = counts && counts[key] != null
            ? counts[key]
            : 0;

    });

}


// ------------------------------------------
// Loading the report queue
// ------------------------------------------

const adminList = document.getElementById("adminList");

const adminCount = document.getElementById("adminCount");

const adminDenied = document.getElementById("adminDenied");

const adminStats = document.getElementById("adminStats");

const adminWho = document.getElementById("adminWho");

const adminPanel = document.querySelector(".admin-panel");


function showDenied() {

    adminDenied.hidden = false;

    adminStats.hidden = true;

    adminPanel.hidden = true;

    adminWho.hidden = true;

}


function actionsMarkup(report) {

    // A finished report keeps no controls at all — just a clean tick.

    if (report.status === "Resolved") {

        return (
            '<div class="admin-done" role="status" aria-label="Report resolved">' +

                '<span class="admin-tick" aria-hidden="true">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
                    ' stroke-width="2.6" stroke-linecap="round"' +
                    ' stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>' +
                "</span>" +

            "</div>"
        );

    }

    const buttons = STATUSES.map(function (status) {

        const active = status === report.status;

        // Work moves forward only: a report that is being worked on can
        // no longer be pushed back to Pending.

        const blocked =
            active || (report.status === "In Progress" && status === "Pending");

        return (
            '<button class="admin-status-btn ' +
            (active ? "is-active " : "") +
            statusClass(status) +
            '" type="button" data-status="' + escapeHtml(status) + '"' +
            (blocked ? " disabled" : "") +
            (active ? ' aria-pressed="true"' : ' aria-pressed="false"') +
            ">" + escapeHtml(status) + "</button>"
        );

    }).join("");


    return (
        '<div class="admin-actions" role="group" aria-label="Set status for report ' +
            report.id + '">' +
            buttons +
        "</div>"
    );

}


function rowMarkup(report) {

    const category = CATEGORY_LABELS[report.issue] || CATEGORY_LABELS.other;

    return (
        '<article class="admin-row" data-id="' + report.id + '">' +

            '<div class="admin-row-main">' +

                '<div class="admin-row-top">' +

                    '<span class="report-tag">#' + report.id + "</span>" +

                    '<span class="category-tag">' +
                        '<span aria-hidden="true">' + category[0] + "</span>" +
                        escapeHtml(category[1]) +
                    "</span>" +

                    '<span class="status-chip ' + statusClass(report.status) + '">' +
                        escapeHtml(report.status) +
                    "</span>" +

                "</div>" +

                '<p class="admin-desc">' +
                    escapeHtml(report.description) +
                "</p>" +

                '<p class="admin-meta">' +
                    "<span>Reported by <strong>" +
                        escapeHtml(report.name || "Anonymous") +
                    "</strong></span>" +

                    (report.address
                        ? '<span class="admin-address">📍 ' +
                          escapeHtml(report.address) + "</span>"
                        : "") +

                    "<span>" + escapeHtml(formatDate(report.created_at)) + "</span>" +
                "</p>" +

            "</div>" +

            actionsMarkup(report) +

        "</article>"
    );

}


function loadReports() {

    fetch("/api/admin/reports", { cache: "no-store" })

        .then(function (response) {

            if (response.status === 403) {

                showDenied();

                throw new Error("Administrator access only.");

            }

            return response.json();

        })

        .then(function (data) {

            setCounts(data.counts);

            const reports = data.reports || [];

            adminCount.textContent =
                reports.length + (reports.length === 1 ? " report" : " reports");

            if (reports.length === 0) {

                adminList.innerHTML =
                    '<p class="admin-empty">No reports yet. ' +
                    "Issues filed on the home page appear here.</p>";

                return;

            }

            adminList.innerHTML = reports.map(rowMarkup).join("");

        })

        .catch(function (error) {

            if (adminDenied.hidden) {

                adminList.innerHTML =
                    '<p class="admin-empty">Could not load the reports. ' +
                    "Please refresh the page.</p>";

                adminCount.textContent = "";

                console.error(error);

            }

        });

}


// ------------------------------------------
// Changing a report's status
// ------------------------------------------

adminList.addEventListener("click", function (event) {

    const button = event.target.closest(".admin-status-btn");

    if (!button) return;

    const row = button.closest(".admin-row");

    const reportId = parseInt(row.getAttribute("data-id"), 10);

    const status = button.getAttribute("data-status");

    const chip = row.querySelector(".status-chip");

    if (chip.textContent === status) return;


    const buttons = row.querySelectorAll(".admin-status-btn");

    buttons.forEach(function (item) { item.disabled = true; });


    fetch("/api/admin/reports/" + reportId + "/status", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ status: status })

    })

        .then(function (response) {

            return response.json().then(function (data) {

                if (!response.ok) throw new Error(data.error || "Update failed.");

                return data;

            });

        })

        .then(function (data) {

            chip.textContent = data.status;

            chip.className = "status-chip " + statusClass(data.status);

            // Controls change shape with the status: a blocked Pending
            // button, or nothing at all once the report is resolved.

            const fresh = document.createElement("div");

            fresh.innerHTML = actionsMarkup({
                id: reportId,
                status: data.status
            });

            const old = row.querySelector(".admin-actions, .admin-done");

            if (old) old.replaceWith(fresh.firstElementChild);

            // The same numbers the public dashboard reads
            setCounts(data.counts);

        })

        .catch(function (error) {

            buttons.forEach(function (item) { item.disabled = false; });

            window.alert(error.message);

        });

});


// ------------------------------------------
// Who is signed in, and getting out again
// ------------------------------------------

document.getElementById("adminLogout").addEventListener("click", function () {

    fetch("/auth/logout", { method: "POST" })

        .then(function () { window.location.href = "/"; })

        .catch(function () { window.location.href = "/"; });

});


fetch("/auth/me", { cache: "no-store" })

    .then(function (response) { return response.json(); })

    .then(function (data) {

        if (data.role !== "admin") {

            showDenied();

            return;

        }

        adminWho.hidden = false;

        adminWho.textContent = "Signed in as " + data.username;

        loadReports();

    })

    .catch(function () { showDenied(); });
