// ==========================================
// 1. Theme Toggle (Light / Dark)
// ==========================================

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


// Respect a saved choice, otherwise use the system preference

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


// ==========================================
// 2. Mobile Navigation Menu
// ==========================================

const navToggle = document.getElementById("navToggle");

const navMenu = document.getElementById("navMenu");


function closeMenu() {

    navToggle.classList.remove("is-open");
    navMenu.classList.remove("is-open");

    navToggle.setAttribute("aria-expanded", "false");

}


if (navToggle && navMenu) {

    navToggle.addEventListener("click", function () {

        const isOpen = navMenu.classList.toggle("is-open");

        navToggle.classList.toggle("is-open", isOpen);

        navToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

    });

    // Close the menu after choosing a link

    navMenu.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", closeMenu);

    });

}


// ==========================================
// 3. Sticky Header + Scroll Effects
// ==========================================

const siteHeader = document.getElementById("siteHeader");

const topButton = document.getElementById("topButton");


function handleScroll() {

    const scrolled = window.scrollY > 24;

    siteHeader.classList.toggle("is-scrolled", scrolled);

    topButton.classList.toggle("is-visible", window.scrollY > 500);

}


window.addEventListener("scroll", handleScroll, { passive: true });

handleScroll();


// ==========================================
// 4. Active Navigation Link While Scrolling
// ==========================================

const sections =
    document.querySelectorAll("section[id]");

const navLinks =
    document.querySelectorAll(".nav-link");


const sectionObserver = new IntersectionObserver(
    function (entries) {

        entries.forEach(function (entry) {

            if (!entry.isIntersecting) return;

            navLinks.forEach(function (link) {

                link.classList.toggle(
                    "is-active",
                    link.getAttribute("href") === "#" + entry.target.id
                );

            });

        });

    },
    { rootMargin: "-45% 0px -50% 0px" }
);


sections.forEach(function (section) {

    sectionObserver.observe(section);

});


// ==========================================
// 5. Reveal Elements On Scroll
// ==========================================

const revealItems = document.querySelectorAll(".reveal");


const revealObserver = new IntersectionObserver(
    function (entries, observer) {

        entries.forEach(function (entry) {

            if (entry.isIntersecting) {

                entry.target.classList.add("is-visible");

                observer.unobserve(entry.target);

            }

        });

    },
    { threshold: 0.15 }
);


revealItems.forEach(function (item) {

    revealObserver.observe(item);

});


// ==========================================
// 6. Dashboard Stats
// ==========================================

const statValues =
    document.querySelectorAll(".stat-value");

const dashboardSection =
    document.getElementById("dashboard");

let statsLoaded = false;


function animateCount(element, target) {

    const from =
        parseInt(element.textContent, 10) || 0;

    const duration = 900;

    const startTime = performance.now();


    function step(now) {

        const progress =
            Math.min((now - startTime) / duration, 1);

        // Ease-out so the number slows down as it lands

        const eased =
            1 - Math.pow(1 - progress, 3);

        element.textContent =
            Math.round(from + (target - from) * eased);

        if (progress < 1) {

            requestAnimationFrame(step);

        }

    }


    requestAnimationFrame(step);

}


function loadDashboardStats() {

    fetch("/stats")

        .then(function (response) {
            return response.json();
        })

        .then(function (data) {

            statsLoaded = true;


            statValues.forEach(function (element) {

                const key =
                    element.getAttribute("data-stat");

                animateCount(element, data[key] || 0);

            });


            // Reports organised by category

            const categoryTotals =
                data.categories || {};

            const totalReports =
                data.total || 0;


            document
                .querySelectorAll("[data-category-count]")
                .forEach(function (element) {

                    const key =
                        element.getAttribute("data-category-count");

                    animateCount(element, categoryTotals[key] || 0);

                });


            document
                .querySelectorAll("[data-category-bar]")
                .forEach(function (element) {

                    const key =
                        element.getAttribute("data-category-bar");

                    const share =
                        totalReports > 0
                            ? (categoryTotals[key] || 0) / totalReports
                            : 0;

                    element.style.width =
                        Math.round(share * 100) + "%";

                });

        });

}


// Load the numbers when the dashboard scrolls into view

const dashboardObserver =
    new IntersectionObserver(
        function (entries, observer) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    loadDashboardStats();

                    observer.unobserve(entry.target);

                }

            });

        },
        { threshold: 0.3 }
    );


dashboardObserver.observe(dashboardSection);


// Keep the numbers honest while the page stays open: an administrator
// can move a report to In Progress or Resolved at any moment, and this
// tab should pick that up as soon as it is looked at again.

document.addEventListener("visibilitychange", function () {

    if (document.visibilityState === "visible" && statsLoaded) {

        loadDashboardStats();

    }

});


// ==========================================
// 7. Explore More Button
// ==========================================

let exploreButton =
    document.getElementById("exploreButton");


exploreButton.addEventListener("click", function () {

    document.getElementById("eco-tips").scrollIntoView({
        behavior: "smooth"
    });

});


// ==========================================
// 8. Report Form
// ==========================================

let reportForm =
    document.getElementById("reportForm");


let nameBox =
    document.getElementById("name");


let issueBox =
    document.getElementById("issue");


let addressBox =
    document.getElementById("address");


let descriptionBox =
    document.getElementById("description");


let characterCount =
    document.getElementById("characterCount");


let formMessage =
    document.getElementById("formMessage");


// ==========================================
// 9. Form Submission
// ==========================================

reportForm.addEventListener("submit", function (event) {

    event.preventDefault();


    // Get user input

    let name =
        nameBox.value.trim();

    let issue =
        issueBox.value;

    let address =
        addressBox.value.trim();

    let description =
        descriptionBox.value.trim();


    // Remove previous error styles

    nameBox.classList.remove("invalid");
    issueBox.classList.remove("invalid");
    addressBox.classList.remove("invalid");
    descriptionBox.classList.remove("invalid");


    // Check Name

    if (name === "") {

        nameBox.classList.add("invalid");

    }


    // Check Issue

    if (issue === "") {

        issueBox.classList.add("invalid");

    }


    // Check Address

    if (address === "") {

        addressBox.classList.add("invalid");

    }


    // Check Description

    if (description === "") {

        descriptionBox.classList.add("invalid");

    }


    // Check whether form is valid

    if (
        name === "" ||
        issue === "" ||
        address === "" ||
        description === ""
    ) {

        formMessage.textContent =
            "Please fill in all the fields.";

    }

    else {

        fetch("/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                issue: issue,
                address: address,
                description: description
            })
        })
            .then(function (response) {

                if (!response.ok) {

                    throw new Error("Report could not be saved");

                }

                return response.json();
            })
            .then(function (data) {

                // Success message plus the tracking ID and a shortcut link

                formMessage.textContent =
                    data.message + " Your tracking ID is #" + data.id + ". ";


                const trackLink =
                    document.createElement("a");

                trackLink.href = "#track";
                trackLink.textContent = "Track this report";

                trackLink.addEventListener("click", function () {

                    trackQueryBox.value = "#" + data.id;

                    runTrackLookup("#" + data.id);

                });

                formMessage.append(trackLink);


                reportForm.reset();

                characterCount.textContent = "Characters: 0 / 200";

                // Keep the dashboard numbers in sync

                if (statsLoaded) {

                    loadDashboardStats();

                }

            })
            .catch(function () {

                formMessage.textContent =
                    "Could not save the report. Please try again.";

            });

    }

});


// ==========================================
// 10. Remove Error When User Corrects Field
// ==========================================

nameBox.addEventListener("input", function () {

    nameBox.classList.remove("invalid");

});


descriptionBox.addEventListener("input", function () {

    descriptionBox.classList.remove("invalid");

});


issueBox.addEventListener("change", function () {

    issueBox.classList.remove("invalid");

});


addressBox.addEventListener("input", function () {

    addressBox.classList.remove("invalid");

});


// ==========================================
// 11. Character Counter
// ==========================================

descriptionBox.addEventListener("input", function () {

    let count =
        descriptionBox.value.length;


    characterCount.textContent =
        "Characters: " + count + " / 200";

});


// ==========================================
// 12. Back To Top Button
// ==========================================

topButton.addEventListener("click", function () {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});


// ==========================================
// 13. Report Tracking
// ==========================================

const trackForm =
    document.getElementById("trackForm");


const trackQueryBox =
    document.getElementById("trackQuery");


const trackMessage =
    document.getElementById("trackMessage");


const trackResults =
    document.getElementById("trackResults");


const ISSUE_LABELS = {
    waste: "Waste",
    garbage: "Waste",          // older reports
    water: "Water Pollution",
    road: "Road Cleanliness",
    air: "Air Pollution",
    noise: "Noise Pollution",
    green: "Green Cover",
    other: "Other"
};


function statusClass(status) {

    const value =
        String(status || "").toLowerCase();


    if (value.indexOf("progress") !== -1) {

        return "status-in-progress";

    }


    if (value.indexOf("resolved") !== -1) {

        return "status-resolved";

    }


    return "status-pending";

}


function formatDate(value) {

    if (!value) return "";


    const date =
        new Date(String(value).replace(" ", "T") + "Z");


    if (isNaN(date.getTime())) return value;


    return date.toLocaleString(undefined, {

        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"

    });

}


function renderReports(reports) {

    trackResults.textContent = "";


    reports.forEach(function (report) {

        const item =
            document.createElement("article");

        item.className = "track-item";


        const head =
            document.createElement("div");

        head.className = "track-item-head";


        const idChip =
            document.createElement("span");

        idChip.className = "report-id";
        idChip.textContent = "#" + report.id;


        const issueChip =
            document.createElement("span");

        issueChip.className = "issue-chip";
        issueChip.textContent =
            ISSUE_LABELS[report.issue] || report.issue || "Issue";


        const badge =
            document.createElement("span");

        badge.className =
            "status-badge " + statusClass(report.status);

        badge.textContent =
            report.status || "Pending";


        head.append(idChip, issueChip, badge);


        const description =
            document.createElement("p");

        description.className = "track-desc";
        description.textContent =
            report.description || "";


        const address =
            document.createElement("p");

        address.className = "track-address";
        address.textContent =
            "\ud83d\udccd " + (report.address || "");


        const date =
            document.createElement("p");

        date.className = "track-date";
        date.textContent =
            "Submitted " + formatDate(report.created_at);


        item.append(head, description);

        // Older reports have no address stored

        if (report.address) {

            item.append(address);

        }

        item.append(date);

        trackResults.append(item);

    });

}


function runTrackLookup(query) {

    const value =
        String(query || "").trim();


    if (value === "") {

        trackMessage.textContent =
            "Enter your name or a report ID to see its status.";

        trackResults.textContent = "";

        return;

    }


    trackMessage.textContent = "Searching…";


    fetch("/track?q=" + encodeURIComponent(value))

        .then(function (response) {
            return response.json();
        })

        .then(function (data) {

            const reports = data.reports || [];


            if (reports.length === 0) {

                trackMessage.textContent =
                    "No reports found for \u201c" + value + "\u201d.";

                trackResults.textContent = "";

                return;

            }


            trackMessage.textContent =
                reports.length === 1
                    ? "1 report found."
                    : reports.length + " reports found.";


            renderReports(reports);

        })

        .catch(function () {

            trackMessage.textContent =
                "Could not reach the server. Please try again.";

        });

}


trackForm.addEventListener("submit", function (event) {

    event.preventDefault();

    runTrackLookup(trackQueryBox.value);

});


// ==========================================
// 14. Live Location For The Address Field
// ==========================================

const locationButton =
    document.getElementById("locationButton");


const locationStatus =
    document.getElementById("locationStatus");


function showLocationStatus(message, isError) {

    locationStatus.textContent = message;

    locationStatus.classList.toggle("is-error", Boolean(isError));

}


// Typing by hand replaces anything we filled in

addressBox.addEventListener("input", function () {

    showLocationStatus("", false);

});


// Pick the useful parts of a Nominatim response and drop
// the duplicated administrative clutter

function formatAddress(data) {

    const parts =
        data.address || {};

    const candidates = [
        parts.road || parts.street || parts.house_name,
        parts.suburb || parts.quarter || parts.neighbourhood,
        parts.city || parts.town || parts.village || parts.county,
        parts.state,
        parts.postcode
    ];

    const chosen = [];

    candidates.forEach(function (part) {

        if (part && chosen.indexOf(part) === -1) {

            chosen.push(part);

        }

    });

    if (chosen.length === 0) {

        return data.display_name || null;

    }

    return chosen.join(", ");

}


// Turn coordinates into a readable street address.
// Uses the free OpenStreetMap Nominatim service (no API key).
// Resolves with the formatted address, or null on any failure.

function reverseGeocode(latitude, longitude) {

    const url =
        "https://nominatim.openstreetmap.org/reverse" +
        "?format=jsonv2&zoom=18&accept-language=en" +
        "&lat=" + encodeURIComponent(latitude) +
        "&lon=" + encodeURIComponent(longitude);


    const controller =
        new AbortController();

    const timer =
        setTimeout(function () {
            controller.abort();
        }, 6000);


    return fetch(url, { signal: controller.signal })

        .then(function (response) {

            if (!response.ok) {

                throw new Error("Geocoding failed");

            }

            return response.json();

        })

        .then(function (data) {

            clearTimeout(timer);

            return formatAddress(data);

        })

        .catch(function () {

            clearTimeout(timer);

            return null;

        });

}


locationButton.addEventListener("click", function () {

    if (!navigator.geolocation) {

        showLocationStatus(
            "Your browser cannot share live location — type the address instead.",
            true
        );

        return;

    }


    locationButton.classList.add("is-loading");

    locationButton.disabled = true;

    showLocationStatus("Finding your location\u2026", false);


    navigator.geolocation.getCurrentPosition(

        function (position) {

            showLocationStatus("Finding a street address\u2026", false);


            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const coordinates =
                latitude.toFixed(6) + ", " + longitude.toFixed(6);


            // Keep the raw coordinates as a fallback if the
            // address lookup fails or times out

            reverseGeocode(latitude, longitude).then(function (address) {

                locationButton.classList.remove("is-loading");

                locationButton.disabled = false;


                addressBox.value = address || coordinates;

                addressBox.classList.remove("invalid");


                if (address) {

                    showLocationStatus(
                        "Live location added \u2014 edit it if you like.",
                        false
                    );

                }

                else {

                    showLocationStatus(
                        "Street address unavailable \u2014 coordinates added instead.",
                        false
                    );

                }

            });

        },

        function (error) {

            locationButton.classList.remove("is-loading");

            locationButton.disabled = false;


            let message =
                "Location unavailable \u2014 type the address instead.";


            if (error.code === error.PERMISSION_DENIED) {

                message =
                    "Location permission was denied \u2014 type the address instead.";

            }

            else if (error.code === error.TIMEOUT) {

                message =
                    "Location request timed out \u2014 type the address instead.";

            }


            showLocationStatus(message, true);

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }

    );

});


// ==========================================
// 15. Login With Mobile Number + OTP
// ==========================================

const profileButton =
    document.getElementById("profileButton");

const profileMenu =
    document.getElementById("profileMenu");

const profileLabel =
    document.getElementById("profileLabel");

const profilePhone =
    document.getElementById("profilePhone");

const profileRole =
    document.getElementById("profileRole");

const entryButton =
    document.getElementById("entryButton");

const adminLink =
    document.getElementById("adminLink");

const logoutButton =
    document.getElementById("logoutButton");

const loginModal =
    document.getElementById("loginModal");

const loginClose =
    document.getElementById("loginClose");

const phoneStep =
    document.getElementById("phoneStep");

const otpStep =
    document.getElementById("otpStep");

const phoneInput =
    document.getElementById("phoneInput");

const sendOtpButton =
    document.getElementById("sendOtpButton");

const otpInput =
    document.getElementById("otpInput");

const otpPhone =
    document.getElementById("otpPhone");

const verifyButton =
    document.getElementById("verifyButton");

const changeNumber =
    document.getElementById("changeNumber");

const resendButton =
    document.getElementById("resendButton");

const resendTimer =
    document.getElementById("resendTimer");

const demoOtpBox =
    document.getElementById("demoOtp");

const loginMessage =
    document.getElementById("loginMessage");

const loginStep =
    document.getElementById("loginStep");

const signupStep =
    document.getElementById("signupStep");

const loginUser =
    document.getElementById("loginUser");

const loginPass =
    document.getElementById("loginPass");

const signupUser =
    document.getElementById("signupUser");

const signupPass =
    document.getElementById("signupPass");

const signupConfirm =
    document.getElementById("signupConfirm");


const PHONE_PATTERN = /^[6-9]\d{9}$/;


// The number the current OTP was sent to

let activePhone = "";

let resendInterval = null;


function showLoginMessage(text, type) {

    loginMessage.textContent = text || "";

    loginMessage.classList.toggle("is-error", type === "error");

    loginMessage.classList.toggle("is-success", type === "success");

}


function formatPhone(phone) {

    return phone.slice(0, 5) + " " + phone.slice(5);

}


// Sections an administrator has no use for on the public page —
// they get their own control room at /admin instead.

const memberLinks = [
    document.getElementById("navAbout"),
    document.getElementById("navEcoTips"),
    document.getElementById("navReport")
].filter(Boolean);


const memberSections = [
    document.getElementById("about"),
    document.getElementById("eco-tips"),
    document.getElementById("report")
].filter(Boolean);


const scrollCue =
    document.querySelector(".scroll-cue");

const heroReportLink =
    document.getElementById("heroReport");

const dashboardLink =
    document.getElementById("navDashboard");

// dashboardSection already exists further up (the scroll observer uses it)


function setNavForRole(account) {

    // account is null when nobody is signed in

    const signedIn = Boolean(account && (account.username || account.phone));

    const isAdmin = signedIn && account.role === "admin";

    // The dashboard is an administrator's view: hidden from visitors
    // before sign-up/log-in, and from signed-in members too.

    const hideDashboard = !isAdmin;


    memberLinks.forEach(function (link) {

        link.hidden = isAdmin;

    });


    // The content itself, not just the menu entry: an administrator
    // never sees About, Eco Tips or the report form.

    memberSections.forEach(function (section) {

        section.hidden = isAdmin;

    });


    // Both of these only lead to sections that are now gone.

    const explore = document.getElementById("exploreButton");

    if (explore) {

        explore.hidden = isAdmin;

    }


    if (scrollCue) {

        scrollCue.hidden = isAdmin;

    }


    // Filing an issue is not an administrator's job — the hero button
    // becomes a shortcut for following one up instead.

    if (heroReportLink) {

        heroReportLink.textContent = isAdmin
            ? "Update Report"
            : "Report an Issue";

        heroReportLink.setAttribute("href", isAdmin ? "/admin" : "#report");

    }


    // The dashboard is public on the landing page, but a signed-in
    // member should not see it.

    if (dashboardLink) {

        dashboardLink.hidden = hideDashboard;

    }


    if (dashboardSection) {

        dashboardSection.hidden = hideDashboard;

    }

}


// The landing page starts in the visitor state: no dashboard until
// /auth/me tells us who (if anyone) is signed in.

setNavForRole(null);


function setAuthState(account) {

    // account is { username, phone, role } when signed in, otherwise null

    if (account && (account.username || account.phone)) {

        const who = account.username || formatPhone(account.phone);


        profileLabel.textContent = "Signed in as";

        profilePhone.textContent = who;


        if (account.username && account.role) {

            profileRole.hidden = false;

            profileRole.textContent = account.role === "admin"
                ? "Administrator"
                : "User";

        }

        else {

            profileRole.hidden = true;

            profileRole.textContent = "";

        }


        profileMenu.hidden = true;

        profileButton.setAttribute("aria-expanded", "false");


        profileButton.hidden = false;
        entryButton.hidden = true;


        // The control room is only reachable by an administrator

        if (adminLink) {

            adminLink.hidden = account.role !== "admin";

        }


        setNavForRole(account);


        profileButton.classList.add("is-signed-in");

        profileButton.setAttribute(
            "aria-label",
            "Account menu, signed in as " + who
        );

    }

    else {

        profileMenu.hidden = true;


        profileButton.hidden = true;
        entryButton.hidden = false;


        if (adminLink) {

            adminLink.hidden = true;

        }


        setNavForRole(null);


        profileRole.hidden = true;

        profileRole.textContent = "";


        profileButton.classList.remove("is-signed-in");

        profileButton.setAttribute("aria-label", "Open account menu");

    }

}


// Show exactly one step of the login window

function showStep(step) {

    [loginStep, signupStep, phoneStep, otpStep].forEach(function (form) {

        form.hidden = form !== step;

    });


    showLoginMessage("", null);

}


// The account menu in the right corner

function openProfileMenu() {

    profileMenu.hidden = false;

    profileButton.setAttribute("aria-expanded", "true");

}


function closeProfileMenu() {

    profileMenu.hidden = true;

    profileButton.setAttribute("aria-expanded", "false");

}


function openLoginModal() {

    loginModal.hidden = false;

    document.body.classList.add("modal-open");


    window.setTimeout(function () {

        if (!loginStep.hidden) {

            loginUser.focus();

        }

        else if (!signupStep.hidden) {

            signupUser.focus();

        }

        else if (!otpStep.hidden) {

            otpInput.focus();

        }

        else {

            phoneInput.focus();

        }

    }, 60);

}


function closeLoginModal() {

    loginModal.hidden = true;

    document.body.classList.remove("modal-open");

    showLoginMessage("", null);

}


function stopResendCountdown() {

    if (resendInterval) {

        clearInterval(resendInterval);

        resendInterval = null;

    }

}


function startResendCountdown(seconds) {

    stopResendCountdown();


    let remaining = seconds;


    resendButton.disabled = true;

    resendTimer.textContent = "(" + remaining + "s)";


    resendInterval = setInterval(function () {

        remaining -= 1;


        if (remaining <= 0) {

            stopResendCountdown();

            resendTimer.textContent = "";

            resendButton.disabled = false;

            return;

        }


        resendTimer.textContent = "(" + remaining + "s)";

    }, 1000);

}


function showLoginStep() {

    showStep(loginStep);


    loginPass.value = "";


    loginUser.focus();

}


function showSignupStep() {

    showStep(signupStep);


    signupPass.value = "";
    signupConfirm.value = "";


    // Every new account starts as a regular user

    const userRole = signupStep.querySelector(
        'input[name="signupRole"][value="user"]'
    );

    if (userRole) {

        userRole.checked = true;

    }


    signupUser.focus();

}


function showOtpStep(phone) {

    activePhone = phone;


    showStep(otpStep);


    otpPhone.textContent = formatPhone(phone);

    otpInput.value = "";

    otpInput.classList.remove("is-invalid");


    otpInput.focus();

}


function showPhoneStep() {

    showStep(phoneStep);


    demoOtpBox.hidden = true;

    stopResendCountdown();

    resendTimer.textContent = "";

    resendButton.disabled = true;

    otpInput.value = "";


    phoneInput.focus();

}


// POST helper that turns server errors into readable messages

function postJson(url, payload) {

    return fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)

    }).then(function (response) {

        return response.json().then(function (data) {

            if (!response.ok) {

                throw new Error(
                    data.error || "Something went wrong. Please try again."
                );

            }

            return data;

        });

    });

}


function sendOtpRequest(phone) {

    sendOtpButton.classList.add("is-loading");

    sendOtpButton.disabled = true;


    postJson("/auth/request-otp", { phone: phone })

        .then(function (data) {

            sendOtpButton.classList.remove("is-loading");

            sendOtpButton.disabled = false;


            showOtpStep(data.phone || phone);

            startResendCountdown(data.resendAfter || 30);


            // Demo mode: no SMS provider is connected, so the page shows the code

            if (data.demoOtp) {

                demoOtpBox.textContent =
                    "Demo mode \u2014 your OTP is " + data.demoOtp +
                    ". Connect an SMS provider to send it as a text message.";

                demoOtpBox.hidden = false;

            }

        })

        .catch(function (error) {

            sendOtpButton.classList.remove("is-loading");

            sendOtpButton.disabled = false;


            showLoginMessage(error.message, "error");

        });

}


function verifyOtpRequest(otp) {

    verifyButton.classList.add("is-loading");

    verifyButton.disabled = true;


    postJson("/auth/verify-otp", { phone: activePhone, otp: otp })

        .then(function (data) {

            verifyButton.classList.remove("is-loading");

            verifyButton.disabled = false;


            setAuthState({ username: null, phone: data.phone });

            showLoginMessage("Logged in successfully.", "success");


            window.setTimeout(function () {

                closeLoginModal();

                showLoginStep();

            }, 700);

        })

        .catch(function (error) {

            verifyButton.classList.remove("is-loading");

            verifyButton.disabled = false;


            otpInput.classList.add("is-invalid");

            showLoginMessage(error.message, "error");


            otpInput.focus();

            otpInput.select();

        });

}


// Open and close the window

profileButton.addEventListener("click", function (event) {

    // Stop the outside-click handler from closing it again right away

    event.stopPropagation();


    if (profileMenu.hidden) {

        openProfileMenu();

    }

    else {

        closeProfileMenu();

    }

});


// Click anywhere else and the account menu closes

document.addEventListener("click", function (event) {

    if (profileMenu.hidden) return;


    const navProfile = document.getElementById("navProfile");


    if (!navProfile.contains(event.target)) {

        closeProfileMenu();

    }

});


entryButton.addEventListener("click", openLoginModal);


// Moving between login, sign-up and the optional OTP steps

document.getElementById("goSignup").addEventListener(
    "click",
    showSignupStep
);


document.getElementById("goLogin").addEventListener(
    "click",
    showLoginStep
);


document.getElementById("goPhone").addEventListener(
    "click",
    showPhoneStep
);


document.getElementById("goLoginFromPhone").addEventListener(
    "click",
    showLoginStep
);


function markInvalid(field, message) {

    field.classList.add("is-invalid");

    showLoginMessage(message, "error");

    field.focus();

}


function clearInvalid(fields) {

    fields.forEach(function (field) {

        field.classList.remove("is-invalid");

    });


    showLoginMessage("", null);

}


function finishLogin(button, message) {

    button.classList.remove("is-loading");

    button.disabled = false;


    showLoginMessage(message, "success");


    window.setTimeout(function () {

        closeLoginModal();

        showLoginStep();

    }, 800);

}


function failLogin(button, error, fields) {

    button.classList.remove("is-loading");

    button.disabled = false;


    showLoginMessage(error.message, "error");


    if (fields) {

        fields.forEach(function (field) {

            field.classList.add("is-invalid");

        });

    }

}


// Step 1: log in with username + password

loginStep.addEventListener("submit", function (event) {

    event.preventDefault();


    const username = loginUser.value.trim();

    const password = loginPass.value;

    const button = document.getElementById("loginSubmit");


    clearInvalid([loginUser, loginPass]);


    if (username === "" || password === "") {

        markInvalid(
            username === "" ? loginUser : loginPass,
            "Enter your username and password."
        );

        return;

    }


    button.classList.add("is-loading");

    button.disabled = true;


    postJson("/auth/login", { username: username, password: password })

        .then(function (data) {

            finishLogin(button, "Welcome back, " + data.username + "!");

            setAuthState({
                username: data.username,
                phone: null,
                role: data.role || "user"
            });

        })

        .catch(function (error) {

            failLogin(button, error, [loginPass]);

            loginPass.value = "";

            loginPass.focus();

        });

});


// Step 2: sign up with a username and password

signupStep.addEventListener("submit", function (event) {

    event.preventDefault();


    const username = signupUser.value.trim();

    const password = signupPass.value;

    const confirm = signupConfirm.value;

    const button = document.getElementById("signupSubmit");

    const roleInput = signupStep.querySelector(
        'input[name="signupRole"]:checked'
    );

    const role = roleInput ? roleInput.value : "user";


    const fields = [signupUser, signupPass, signupConfirm];


    clearInvalid(fields);


    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {

        markInvalid(
            signupUser,
            "Username must be 3-20 letters, numbers or underscores."
        );

        return;

    }


    if (password.length < 6) {

        markInvalid(signupPass, "Password must be at least 6 characters.");

        return;

    }


    if (password !== confirm) {

        markInvalid(signupConfirm, "The passwords do not match.");

        return;

    }


    button.classList.add("is-loading");

    button.disabled = true;


    postJson("/auth/signup", {

        username: username,

        password: password,

        confirm: confirm,

        role: role

    })

        .then(function (data) {

            finishLogin(button, "Account created. You are logged in!");

            setAuthState({
                username: data.username,
                phone: null,
                role: data.role || "user"
            });

        })

        .catch(function (error) {

            failLogin(button, error, [signupUser]);

        });

});


loginClose.addEventListener("click", closeLoginModal);


loginModal.addEventListener("click", function (event) {

    if (event.target === loginModal) {

        closeLoginModal();

    }

});


document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") return;


    if (!loginModal.hidden) {

        closeLoginModal();

        return;

    }


    if (!profileMenu.hidden) {

        closeProfileMenu();

    }

});


// Step 1: mobile number

phoneInput.addEventListener("input", function () {

    phoneInput.value =
        phoneInput.value.replace(/\D/g, "").slice(0, 10);


    phoneInput.parentElement.classList.remove("is-invalid");

    showLoginMessage("", null);

});


phoneStep.addEventListener("submit", function (event) {

    event.preventDefault();


    const phone = phoneInput.value.trim();


    if (!PHONE_PATTERN.test(phone)) {

        phoneInput.parentElement.classList.add("is-invalid");

        showLoginMessage(
            "Enter a valid 10-digit mobile number.",
            "error"
        );

        phoneInput.focus();

        return;

    }


    phoneInput.parentElement.classList.remove("is-invalid");

    sendOtpRequest(phone);

});


// Step 2: one-time password

otpInput.addEventListener("input", function () {

    otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);


    otpInput.classList.remove("is-invalid");

    showLoginMessage("", null);


    // Six digits typed \u2014 verify straight away, as an SMS auto-fill would

    if (otpInput.value.length === 6) {

        verifyOtpRequest(otpInput.value);

    }

});


otpStep.addEventListener("submit", function (event) {

    event.preventDefault();


    const otp = otpInput.value.trim();


    if (otp.length !== 6) {

        otpInput.classList.add("is-invalid");

        showLoginMessage("Enter the 6-digit OTP.", "error");

        otpInput.focus();

        return;

    }


    verifyOtpRequest(otp);

});


changeNumber.addEventListener("click", showPhoneStep);


resendButton.addEventListener("click", function () {

    if (!activePhone) return;


    sendOtpRequest(activePhone);

});


// Session: stay logged in across refreshes

logoutButton.addEventListener("click", function () {

    closeProfileMenu();


    fetch("/auth/logout", { method: "POST" })

        .then(function () {

            setAuthState(null);

        })

        .catch(function () {

            setAuthState(null);

        });

});


fetch("/auth/me", { cache: "no-store" })

    .then(function (response) {

        return response.json();

    })

    .then(function (data) {

        if (data.username || data.phone) {

            setAuthState({
                username: data.username,
                phone: data.phone,
                role: data.role
            });

        }

    })

    .catch(function () {

        // Not signed in \u2014 keep the Login button as it is

    });
