// sponsor.js

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
  return `/public/sponsor/${imageMap[type] || "default.jpg"}`;
}

function renderCases(filter) {
  const container = document.getElementById("casesContainer");
  container.innerHTML = "";

  let filtered =
    filter === "all"
      ? casesData
      : casesData.filter((c) => c.type === filter);

  // الترتيب 
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

    // زر الاكتراث 
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
      if (currentUser && currentUser.id) {
        sponsorBtn = `<a href="DonateNow.html?type=sponsor&id=${caseItem._id}" class="btn btn-primary">
      <i class="fas fa-hands-helping"></i> اكفل الآن
    </a>`;
      } else {
        sponsorBtn = `<a href="login.html" class="btn btn-login-prompt">
 سجّل دخولك أولًا
</a>`;
      }
    }

    // ختم الحالة
    const badge =
      caseItem.status === "fully sponsored"
        ? `<div class="status-badge fully-sponsored"><span>مكفولة بنجاح</span></div>`
        : caseItem.status === "partially sponsored"
        ? `<div class="status-badge partially-sponsored"><span>مكفولة جزئياً</span></div>`
        : "";

    // عرض المبلغ
    const amountTag = `${caseItem.amountPerPeriod} ₪/${caseItem.periodLabel}`;

    //  إنشاء البطاقة مع دعم البحث (data attributes)
    const card = document.createElement("div");
    card.className = "col-12 col-md-6 col-lg-4 sponsor-card-wrapper";
    //  مهم: إضافة البيانات المطلوبة للبحث (caseId و firstName)
    card.dataset.caseId = caseItem.caseId?.toLowerCase() || "";
    card.dataset.firstName = caseItem.firstName?.toLowerCase() || "";

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
            <a href="kafala-details.html?id=${caseItem._id}" class="btn btn-outline-primary">
              عرض التفاصيل
            </a>
            ${sponsorBtn}
            <button class="btn-share" onclick="shareSponsorship('${caseItem._id}')">
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

/* 
   ===========================================================
    خاصية البحث 
   ===========================================================
   المطلوب:
     1. البحث برقم الحالة (مثل ORP001) → نتيجة واحدة، تظليل مباشر.
     2. البحث باسم فقط (مثل "زياد") → تظليل جميع التطابقات + scroll لأول واحدة + رسالة: " يُفضّل إضافة الرقم".
     3. البحث باسم + رقم (مثل "زياد ORP001") → يُعامل كرقم (نتيجة واحدة).
     4. الرسائل تظهر لمدة ثانيتين فقط.
     5. التظليل ثابت (بنفسجي شفاف) على <div class="sponsor-card"> مباشرةً.
   ===========================================================
*/
let searchTimeout = null;

// دالة مساعدة: عرض Toast مؤقت (يظهر فوق شريط البحث)
function showTemporaryToast(message, duration = 2000) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  //  وضع.Toast مباشرة فوق شريط البحث
  const searchBar = document.querySelector(".search-bar");
  if (searchBar) {
    const rect = searchBar.getBoundingClientRect();
    toast.style.top = `${rect.top - 50}px`; // 50px = ارتفاع Toast + مسافة
  }

  // إظهار فوري
  toast.classList.add("show");

  //  إخفاء بعد المدة المحددة (2000 مللي ثانية = ثانيتان)
  setTimeout(() => {
    toast.classList.remove("show");
    // إزالة بعد انتهاء الانتقال
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300); // يساوي transition-duration في CSS
  }, duration);
}

// الدالة الأساسية للبحث
function performSearchForSponsorships() {
  //  1. جلب قيمة البحث
  const searchInput = document.getElementById("searchInput");
  const rawTerm = searchInput ? searchInput.value.trim() : "";
  const searchTerm = rawTerm.toLowerCase();

  //  2. تنظيف أولي: إزالة تظليل البحث من جميع البطاقات
  document.querySelectorAll(".sponsor-card-wrapper").forEach((card) => {
    const sponsorCard = card.querySelector(".sponsor-card"); //  نستهدف البطاقة الداخلية
    if (sponsorCard) sponsorCard.classList.remove("highlight");
  });

  // 🧹 3. إزالة أي Toast سابق
  document.querySelectorAll(".toast").forEach((t) => t.remove());

  //  4. إذا كان الحقل فارغًا → خروج مبكر (لا بحث)
  if (!searchTerm) return;

  //  5. كشف: هل يحتوي المُدخل على رقم كفالة؟ (مثل ORP001)
  //    نستخدم تعبيرًا نمطيًّا: 3 أحرف كبيرة + 3 أرقام
  const caseIdPattern = /[A-Z]{3}\d{3}/i;
  const match = searchTerm.match(caseIdPattern);
  const hasCaseId = !!match;
  const extractedCaseId = hasCaseId ? match[0].toLowerCase() : null;

  //  6. جلب جميع بطاقات الكفالات (من DOM — لأنها مبنية مسبقًا)
  const cards = document.querySelectorAll(".sponsor-card-wrapper");
  let matchedCards = []; // لتخزين البطاقات المطابقة (للاستخدام في التمرير)

  // 🔎 7. التكرار على البطاقات وتحديد المطابقات
  cards.forEach((card) => {
    const caseId = card.dataset.caseId || ""; // من renderCases
    const firstName = card.dataset.firstName || ""; // من renderCases
    const sponsorCard = card.querySelector(".sponsor-card");

    if (!sponsorCard) return; // تأمين

    let shouldHighlight = false;

    //  أولوية للرقم: إذا وُجد رقم في المُدخل، نبحث فقط به
    if (hasCaseId) {
      if (caseId.includes(extractedCaseId)) {
        shouldHighlight = true;
      }
    } 
    //  إذا لم يُدخل رقمًا → نبحث بالاسم فقط
    else {
      if (firstName.includes(searchTerm)) {
        shouldHighlight = true;
      }
    }

    //  تطبيق التظليل (ثابت — لا يعتمد على animation)
    if (shouldHighlight) {
      sponsorCard.classList.add("highlight"); // ← يُفعّل ::before في sponsor.css
      matchedCards.push(card);
    }
  });

  //  8. هل وُجدت نتائج؟
  const foundAny = matchedCards.length > 0;

  //  9. التمرير إلى أول نتيجة — فقط إذا وُجدت نتائج
  if (foundAny) {
    const firstMatch = matchedCards[0];
    // ✅ التمرير السلس (يظهر أول بطاقة مطابقة في وسط الشاشة تقريبًا)
    firstMatch.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  //  10. عرض الرسائل (بعد التمرير — لتجربة مستخدم أفضل)

  //  حالة: لا توجد نتائج
  if (!foundAny) {
    showTemporaryToast("❌ لا توجد كفالات تطابق بحثك.", 2000);
    return; // ننهي هنا
  }

  // 💡 حالة: بحث باسم فقط (بدون رقم) — نعرض رسالة توجيهية
  if (!hasCaseId) {
    showTemporaryToast("💡 يُفضّل إضافة الرقم لنتائج أفضل.", 2000);
  }

  //  ملاحظة: إذا كان البحث برقم → لا تظهر أي رسالة (حتى لو وُجدت نتائج)
}

//  ربط أحداث البحث (يُفعّل performSearchForSponsorships)
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  const searchBtn = document.getElementById("searchButton");

  //  عند الكتابة (مع debounce لتحسين الأداء)
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearchForSponsorships, 300);
    });

    //  دعم Enter في لوحة المفاتيح
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearchForSponsorships();
      }
    });
  }

  //  عند النقر على زر المسح (×)
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        performSearchForSponsorships(); // ← يُنظف التظليل تلقائيًا
        searchInput.focus();
      }
    });
  }

  //  عند النقر على زر البحث 
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performSearchForSponsorships();
    });
  }
});