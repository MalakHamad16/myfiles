//complaints.js
// دوال تحميل HTML وتهيئة شريط التنقل (تم الإبقاء عليها كما هي)
async function loadHTML(file, elementId) {
  try {
    const response = await fetch(file);
    const data = await response.text();
    const container = document.getElementById(elementId);
    container.innerHTML = data;

    if (file === "navbar.html") {
      initNavbar();
    }

    return true;
  } catch (error) {
    console.error("Error loading HTML:", error);
    return false;
  }
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    navLinks.classList.toggle("active");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".navbar")) {
      navLinks.classList.remove("active");
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  if (navLinks) {
    navLinks.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  document.querySelectorAll(".dropdown-toggle").forEach((item) => {
    item.addEventListener("click", function (e) {
      if (window.innerWidth <= 992) {
        e.preventDefault();
        const dropdown = this.parentNode;
        dropdown.classList.toggle("active");

        document.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== dropdown) {
            d.classList.remove("active");
          }
        });
      }
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) {
      if (navLinks) navLinks.classList.remove("active");
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });
}

window.addEventListener("DOMContentLoaded", function () {
  loadHTML("navbar.html", "navbar-placeholder");
  loadHTML("footer.html", "footer-placeholder");
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("complaintForm");
  const successMsg = document.getElementById("successMessage");
  const closeBtn = document.getElementById("closeSuccess");

  form.onsubmit = async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      console.log(data);

      form.reset();
      successMsg.classList.add("show");
      successMsg.scrollIntoView({ behavior: "smooth", block: "center" });

      // اختفاء رسالة النجاح بعد 3 ثواني
      setTimeout(() => {
        successMsg.classList.remove("show");
      }, 3000);
    } catch (err) {
      console.error("خطأ:", err);
    }
  };

  closeBtn.onclick = () => {
    successMsg.classList.remove("show");
  };
});
