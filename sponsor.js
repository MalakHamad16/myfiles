// sponsor.js — مُحدّث
let casesData = [];

function getCurrentUser() {
  return (
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user")) ||
    null
  );
}

async function loadCasesFromAPI(filter = "all") {
  try {
    const res = await fetch("/api/sponsorships");
    const data = await res.json();
    if (data.success) {
      casesData = data.sponsorships || [];
      renderCases(filter);
    } else {
      document.getElementById("casesContainer").innerHTML =
        '<div class="alert alert-danger text-center">تعذر تحميل الكفالات.</div>';
    }
  } catch (err) {
    document.getElementById("casesContainer").innerHTML =
      '<div class="alert alert-danger text-center">خطأ في الاتصال.</div>';
  }
}

function getImagePath(type) {
  const imageMap = {
    orphans: "orphans.jpg",
    educational: "educational.jpg",
    health: "health.jpg",
    living: "living.jpg",
    general: "general.jpg",
  };
  return `/uploads/sponsor/${imageMap[type] || "default.jpg"}`;
}

function renderCases(filter) {
  const container = document.getElementById("casesContainer");
  container.innerHTML = "";

  let filtered =
    filter === "all" ? casesData : casesData.filter((c) => c.type === filter);

  //  الترتيب مُفعّل في الباكند — لا حاجة لتكراره هنا
  // لكن للتأكد، نستخدم نفس المنطق:
  const urgencyOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  filtered.sort((a, b) => {
    const statusOrder = {
      "not sponsored": 1,
      "partially sponsored": 2,
      "fully sponsored": 3,
    };
    const sa = statusOrder[a.status],
      sb = statusOrder[b.status];
    if (sa !== sb) return sa - sb;
    const ua = urgencyOrder[a.urgencyLevel] || 3;
    const ub = urgencyOrder[b.urgencyLevel] || 3;
    if (ua !== ub) return ua - ub;
    return (
      new Date(a.preferredSponsorshipDeadline) -
      new Date(b.preferredSponsorshipDeadline)
    );
  });

  const currentUser = getCurrentUser();

  filtered.forEach((caseItem) => {
    const isFully = caseItem.status === "fully sponsored";
    const isPartial = caseItem.status === "partially sponsored";

    //  زر "اكفل الآن" حسب الحالة والكفيل
    let sponsorBtn;
    if (isFully) {
      sponsorBtn = `<button class="btn btn-success disabled" disabled>
    <i class="fas fa-check"></i> تم الكفالة
  </button>`;
    } else if (isPartial) {
      if (
        currentUser &&
        caseItem.sponsorId &&
        currentUser.id === caseItem.sponsorId
      ) {
        sponsorBtn = `<a href="DonateNow.html?type=sponsor&id=${caseItem._id}" class="btn btn-primary">
      <i class="fas fa-hand-holding-usd"></i> ادفع الدفعة
    </a>`;
      } else {
        sponsorBtn = `<button class="btn btn-primary disabled" disabled>
      <i class="fas fa-user-check"></i> مكفولة جزئياً
    </button>`;
      }
    } else {
      // غير مكفولة → مفتوحة للجميع *إذا كان له حساب*
      if (currentUser && currentUser.id) {
        sponsorBtn = `<a href="DonateNow.html?type=sponsor&id=${caseItem._id}" class="btn btn-primary">
      <i class="fas fa-hands-helping"></i> اكفل الآن
    </a>`;
      } else {
        sponsorBtn = `<button class="btn btn-primary disabled" disabled>
  سجّل دخولك أولًا      
    </button>`;
      }
    }

    // ختم الحالة
    const badge = isFully
      ? `<div class="status-badge fully-sponsored"><span>مكفولة بنجاح</span></div>`
      : isPartial
      ? `<div class="status-badge partially-sponsored"><span>مكفولة جزئياً</span></div>`
      : "";

    //  عرض المبلغ كـ "100 ₪/شهريًا"
    const amountTag = `${caseItem.amountPerPeriod} ₪/${caseItem.periodLabel}`;

    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="sponsor-card">
        <div class="card-image">
          <img src="${getImagePath(caseItem.type)}" alt="${caseItem.firstName}">
          ${badge}
          <div class="amount-tag">${amountTag}</div>
        </div>
        <div class="card-body">
          <h3>أهلاً، أنا ${caseItem.firstName}</h3>
          <div class="duration-info">
            <div class="duration-item">
              <span>مدة الكفالة</span>
              <strong>${caseItem.durationLabel}</strong>
            </div>
          </div>
          <div class="card-actions">
            <a href="kafala-details.html?id=${
              caseItem._id
            }" class="btn btn-outline-primary">
              عرض التفاصيل
            </a>
            ${sponsorBtn}
            <button class="btn-share" onclick="shareSponsorship('${
              caseItem._id
            }')">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function shareSponsorship(id) {
  const caseItem = casesData.find((s) => s._id === id);
  if (!caseItem) return alert("الكفالة غير موجودة.");
  const url = `${window.location.origin}/kafala-details.html?id=${id}`;
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <h3>مشاركة: ${caseItem.firstName}</h3>
      <div class="share-icons">
        <a href="https://wa.me/?text=${encodeURIComponent(
          url
        )}" target="_blank"><i class="fab fa-whatsapp"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}" target="_blank"><i class="fab fa-facebook"></i></a>
        <button onclick="navigator.clipboard.writeText('${url}'); alert('تم نسخ الرابط')"><i class="fas fa-link"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = "flex";
  modal.onclick = (e) => e.target === modal && modal.remove();
  modal.querySelector(".modal-close").onclick = () => modal.remove();
}

document.addEventListener("DOMContentLoaded", () => {
  loadCasesFromAPI("all");
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadCasesFromAPI(btn.dataset.filter);
    });
  });
});
