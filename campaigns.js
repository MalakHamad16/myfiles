// campaigns.js 
//  دالة فك تشفير JWT (لقراءة role)
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (e) {
    console.warn("⚠️ Invalid JWT format");
    return null;
  }
}
//  جلب المستخدم الحالي (من localStorage/sessionStorage)
function getCurrentUser() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload || !payload.id) return null;
  // نعطي أولوية للـ role من التوكن (أكثر أمانًا)
  const savedUser = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
  );
  return {
    id: payload.id,
    role: payload.role || savedUser.role || "donor",
    firstName: savedUser.firstName || "",
    lastName: savedUser.lastName || "",
  };
}
//  اشتقاق أذونات المستخدم
const currentUser = getCurrentUser();
const isAdmin = currentUser?.role === "admin";
const isDonor = currentUser?.role === "donor";
const isNeedy = currentUser?.role === "needy";
const isLoggedIn = !!currentUser;
let campaignsData = [];
//  دالة مساعدة لتحويل رمز العملة
function getCurrencySymbol(code) {
  const symbols = { ILS: "₪", USD: "$", JOD: "د.أ", AED: "د.إ" };
  return symbols[code] || "₪";
}
// تحويل تاريخ ISO إلى تنسيق محلي
function formatDateForDisplay(isoDateString) {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}
// دالة لجلب الحملات
async function fetchCampaigns() {
  try {
    const res = await fetch("/api/campaigns");
    if (!res.ok) throw new Error("فشل جلب الحملات");
    const data = await res.json();
    campaignsData = data.map((camp) => ({
      id: camp._id,
      campaignCode: camp._id.substring(0, 6).toUpperCase(),
      title: camp.title,
      goal: camp.goalAmount,
      collectedAmount: camp.collectedAmount || 0,
      currency: getCurrencySymbol(camp.currency || "ILS"),
      startDateRaw: camp.startDate,
      endDateRaw: camp.endDate,
      startDate: formatDateForDisplay(camp.startDate),
      endDate: formatDateForDisplay(camp.endDate),
      description: camp.description,
      image:
        camp.image || "https://via.placeholder.com/300x200?text=لا توجد صورة",
      status: camp.status,
      duration: calculateDuration(camp.startDate, camp.endDate),
    }));
  } catch (err) {
    console.error("❌ خطأ في جلب الحملات:", err);
    alert("فشل تحميل الحملات. يرجى المحاولة لاحقًا.");
  }
}
function calculateDuration(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 30) return `${diffDays} يوم`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} شهر`;
  return `${Math.floor(diffDays / 365)} سنة`;
}
//  إصلاح: استخدام camp.goal (ليس goalAmount)
function getDisplayStatus(camp) {
  const now = new Date();
  const start = new Date(camp.startDateRaw);
  const end = new Date(camp.endDateRaw);
  const collected = camp.collectedAmount || 0;
  // لذا نستخدم camp.goal هنا إذا وُجد، وإلا نستخدم camp.goalAmount
  const goal = camp.goal || camp.goalAmount || 1;
  if (camp.status === "pending") return "pending";
  if (start > now) return "scheduled";
  if (end < now) return collected >= goal ? "completed" : "ended";
  return collected >= goal ? "completed" : "active";
}
function getStatusInfo(displayStatus) {
  const map = {
    active: { text: "نشطة", color: "#16a34a" },
    completed: { text: "مكتملة بنجاح", color: "#3b82f6" },
    ended: { text: "منتهية", color: "#a80909ff" },
    scheduled: { text: "مجدولة", color: "#90909bff" },
    pending: { text: "معلقة", color: "#f59e0b" },
  };
  return map[displayStatus] || { text: "غير معروفة", color: "#5e4668ff" };
}
//  إنشاء بطاقة الحملة — حسب الصلاحية
function createCampaignCard(camp) {
  const displayStatus = getDisplayStatus(camp);
  const statusInfo = getStatusInfo(displayStatus);
  const isDonatable = displayStatus === "active";
  let buttonsHtml = "";
  if (isAdmin) {
    // أزرار المدير
    buttonsHtml = `
      <a href="edit-campaign.html?id=${camp.id}" class="btn btn-admin-edit">تعديل</a>
      <button class="btn btn-admin-delete" onclick="deleteCampaign('${camp.id}')">حذف</button>
      <button class="btn btn-outline" onclick="showDetails('${camp.id}')">عرض التفاصيل</button>
      <button class="btn-share" onclick="shareCampaign('${camp.id}')"><i class="fas fa-share-alt"></i></button>
    `;
  } else {
    // غير المدير (متبرع أو محتاج أو زائر)
    if (isLoggedIn && isDonatable) {
      buttonsHtml = `
        <a href="DonateNow.html?type=donation&campaign=${camp.id}" class="btn btn-primary">تبرع الآن</a>
        <button class="btn btn-outline" onclick="showDetails('${camp.id}')">عرض التفاصيل</button>
        <button class="btn-share" onclick="shareCampaign('${camp.id}')"><i class="fas fa-share-alt"></i></button>
      `;
    } else {
      buttonsHtml = `
        <button class="btn btn-login-prompt">${
          isLoggedIn ? "غير متاح" : "سجّل دخولك أولًا"
        }</button>
        <button class="btn btn-outline" onclick="showDetails('${
          camp.id
        }')">عرض التفاصيل</button>
        <button class="btn-share" onclick="shareCampaign('${
          camp.id
        }')"><i class="fas fa-share-alt"></i></button>
      `;
    }
  }
  const card = document.createElement("div");
  // ✅ إضافة data-camp-id و data-title لتسهيل البحث
  card.className = "campaign-card";
  card.dataset.campId = camp.campaignCode.toLowerCase();
  card.dataset.title = camp.title.toLowerCase();
  card.innerHTML = `
    <div class="campaign-image">
      <img src="${camp.image}" alt="${
    camp.title
  }" onerror="this.src='https://via.placeholder.com/300x200?text=لا توجد صورة'">
      <span class="status-badge" style="background:${
        statusInfo.color
      }; color:white">${statusInfo.text}</span>
    </div>
    <div class="campaign-content">
      <h3 class="campaign-title">${camp.title}</h3>
      <div class="campaign-info-row">
        <span>رقم الحملة: ${camp.campaignCode}</span>
        <span>المدة: ${camp.duration}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${
          (camp.goal || camp.goalAmount)
            ? Math.min(
                100,
                Math.round(
                  (camp.collectedAmount / (camp.goal || camp.goalAmount)) * 100
                )
              )
            : 0
        }%"></div>
      </div>
      <div class="progress-text">
        <span>${camp.collectedAmount.toLocaleString()}${camp.currency}</span>
        <span>من ${(camp.goal || camp.goalAmount).toLocaleString()}${camp.currency}</span>
      </div>
      <div class="card-buttons">${buttonsHtml}</div>
    </div>
  `;
  return card;
}
// عرض الحملات — كما هو (مع الترتيب الصحيح)
function renderCampaigns(filterStatus = "all") {
  const containers = {
    active: document.getElementById("campaignsContainer"),
    scheduled: document.getElementById("scheduledCampaigns"),
    ended: document.getElementById("endedCampaigns"),
    completed: document.getElementById("completedCampaigns"),
    pending: document.getElementById("pendingCampaigns"),
  };
  Object.values(containers).forEach((c) => {
    if (c) c.innerHTML = "";
  });
  let campaignsToRender = [...campaignsData];
  if (filterStatus !== "all") {
    campaignsToRender = campaignsToRender.filter(
      (c) => getDisplayStatus(c) === filterStatus
    );
  }
  campaignsToRender.sort((a, b) => {
    const statusA = getDisplayStatus(a);
    const statusB = getDisplayStatus(b);
    //  الأولوية بين الحالات
    const priority = {
      active: 1,
      scheduled: 2,
      ended: 3,
      pending: 4,
      completed: 5,
    };
    if (priority[statusA] !== priority[statusB]) {
      return priority[statusA] - priority[statusB];
    }
    //  نفس الحالة → ترتيب داخلي
    const now = new Date();
    // دالة مساعدة: نسبة التبرع
    const goalA = a.goal || a.goalAmount || 1;
    const goalB = b.goal || b.goalAmount || 1;
    const ratioA = a.collectedAmount / goalA;
    const ratioB = b.collectedAmount / goalB;
    // دالة مساعدة: مقارنة تواريخ الانتهاء (الأقرب أولًا = أقل قيمة)
    const timeToEndA = new Date(a.endDateRaw).getTime() - now.getTime();
    const timeToEndB = new Date(b.endDateRaw).getTime() - now.getTime();
    // دالة مساعدة: مقارنة تواريخ البداية (للـ scheduled فقط)
    const timeToStartA = new Date(a.startDateRaw).getTime() - now.getTime();
    const timeToStartB = new Date(b.startDateRaw).getTime() - now.getTime();
    switch (statusA) {
      case "active":
      case "ended":
      case "pending":
        // أولاً: نسبة التبرع (الأعلى أولًا)
        if (Math.abs(ratioA - ratioB) > 0.001) return ratioB - ratioA;
        // ثانياً: الأقرب لانتهاء المدة (أقل timeToEnd أولًا)
        return timeToEndA - timeToEndB;
      case "scheduled":
        // فقط حسب تاريخ البداية: الأقرب أولًا
        return timeToStartA - timeToStartB;
      case "completed":
      default:
        // المكتملة → لا ترتيب خاص (أو حسب الأحدث أولًا إن أردت)
        return new Date(b.endDateRaw) - new Date(a.endDateRaw);
    }
  });
  campaignsToRender.forEach((camp) => {
    const displayStatus = getDisplayStatus(camp);
    const card = createCampaignCard(camp);
    const target = containers[displayStatus] || containers.active;
    if (target) target.appendChild(card);
  });
}
// شريط الفلترة
function renderFilterBar() {
  const filterBar = document.createElement("div");
  filterBar.className = "filter-bar";
  const buttons = [
    { text: "الكل", status: "all" },
    { text: "النشطة", status: "active" },
    { text: "المجدولة", status: "scheduled" },
    { text: "المعلقة", status: "pending" },
    { text: "المنتهية", status: "ended" },
    { text: "المكتملة", status: "completed" },
  ];
  buttons.forEach((btn) => {
    const el = document.createElement("button");
    el.textContent = btn.text;
    el.dataset.status = btn.status;
    if (btn.status === "all") el.classList.add("active");
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-bar button")
        .forEach((b) => b.classList.remove("active"));
      el.classList.add("active");
      renderCampaigns(btn.status);
    });
    filterBar.appendChild(el);
  });
  const main = document.querySelector("main");
  const container = document.getElementById("campaignsContainer");
  if (main && container) main.insertBefore(filterBar, container);
}
// ===============  خاصية البحث المُحسّنة ===============
let searchTimeout = null;

function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // 1. إزالة التمييز من الجميع
  document.querySelectorAll('.campaign-card').forEach(card => {
    card.classList.remove('highlight');
  });

  // 2. مسح any previous toast
  document.querySelectorAll('.toast').forEach(t => t.remove());

  if (!searchTerm) return;

  // 3. إجراء البحث
  const cards = document.querySelectorAll('.campaign-card');
  let foundAny = false;
  cards.forEach(card => {
    const id = card.dataset.campId || '';
    const title = card.dataset.title || '';
    if (id.includes(searchTerm) || title.includes(searchTerm)) {
      card.classList.add('highlight');
      foundAny = true;
    }
  });

  // 4. التمرير إلى أول نتيجة
  const firstMatch = document.querySelector('.campaign-card.highlight');
  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 5. عرض Toast فقط عند عدم وجود نتائج — لمدة 2 ثوانٍ
  if (!foundAny) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = '❌ لا توجد حملات تطابق بحثك.';
    document.body.appendChild(toast);

    //  حساب الموضع ديناميكيًّا: فوق شريط البحث
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      const rect = searchBar.getBoundingClientRect();
      toast.style.top = `${rect.top - 50}px`; // 50px = ارتفاع Toast + مسافة
    }

    // إظهار التوست
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // إخفاء بعد 2 ثانية
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300); // وقت transition
    }, 2000);
  }
}

//  🔄 ربط أحداث البحث (مُحدَّث)
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  const searchBtn = document.getElementById("searchButton"); //  زر البحث الجديد

  if (searchInput) {
    // عند الكتابة (debounce)
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 300);
    });

    // عند Enter
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        performSearch();
        searchInput.focus();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      performSearch();
    });
  }
});

// عرض التفاصيل (Modal)
function showDetails(id) {
  const camp = campaignsData.find((c) => c.id === id);
  if (!camp) return;
  const displayStatus = getDisplayStatus(camp);
  const statusInfo = getStatusInfo(displayStatus);
  const isDonatable = displayStatus === "active";
  document.getElementById("modalTitle").textContent = camp.title;
  document.getElementById("modalId").textContent = camp.campaignCode;
  document.getElementById("modalStart").textContent = camp.startDate;
  document.getElementById("modalEnd").textContent = camp.endDate;
  document.getElementById(
    "modalGoal"
  ).textContent = `${(camp.goal || camp.goalAmount).toLocaleString()}${camp.currency}`;
  document.getElementById(
    "modalRaised"
  ).textContent = `${camp.collectedAmount.toLocaleString()}${camp.currency}`;
  document.getElementById("modalDesc").textContent = camp.description;
  document.querySelector(
    ".modal-info"
  ).style.borderLeft = `6px solid ${statusInfo.color}`;
  const btnContainer = document.querySelector(".modal-donate-btn");
  if (btnContainer) {
    if (isAdmin) {
      btnContainer.innerHTML = "";
    } else if (isLoggedIn && isDonatable) {
      btnContainer.innerHTML = `<a href="DonateNow.html?type=donation&campaign=${camp.id}" class="btn btn-primary">تبرع الآن</a>`;
    } else {
      btnContainer.innerHTML = `<button class="btn btn-login-prompt">${
        isLoggedIn ? "غير متاح" : "سجّل دخولك أولًا"
      }</button>`;
    }
  }
  document.getElementById("detailModal").style.display = "flex";
}
// حذف الحملة (مع حماية الواجهة — الحماية الحقيقية في الـ backend)
async function deleteCampaign(id) {
  if (!isAdmin) {
    alert("⚠️ ليس لديك صلاحية حذف الحملات");
    return;
  }
  if (!confirm("هل أنت متأكد من حذف هذه الحملة؟")) return;
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("✅ تم حذف الحملة بنجاح");
      await fetchCampaigns();
      renderCampaigns();
    } else {
      const data = await res.json();
      alert("❌ فشل الحذف: " + (data.message || "غير معروف"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ خطأ في الاتصال بالسيرفر");
  }
}
// مشاركة الحملة
function shareCampaign(id) {
  const camp = campaignsData.find((c) => c.id === id);
  if (!camp) return;
  const url = `${window.location.origin}/campaigns.html`;
  const encodedUrl = encodeURIComponent(url + `#campaign-${id}`);
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <h3>مشاركة الحملة: ${camp.title}</h3>
      <div class="share-icons">
        <a href="https://wa.me/?text=انضم لتبرع في حملة: ${encodeURIComponent(
          camp.title
        )}%0A${url}" target="_blank"><i class="fab fa-whatsapp"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank"><i class="fab fa-facebook"></i></a>
        <button onclick="navigator.clipboard.writeText('${url}').then(() => alert('✓ تم النسخ'))"><i class="fas fa-link"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = "flex";
  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}
//  عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async () => {
  // إظهار زر "إنشاء حملة" فقط للمدراء
  const createBtn = document.getElementById("adminCreateBtn");
  if (createBtn) {
    createBtn.style.display = isAdmin ? "block" : "none";
  }
  await fetchCampaigns();
  renderFilterBar();
  renderCampaigns();
  // إعداد Modal
  const modal = document.getElementById("detailModal");
  const closeBtn = document.querySelector(".modal-close");
  if (modal && closeBtn) {
    closeBtn.onclick = () => (modal.style.display = "none");
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  }
});

// ربط أزرار "سجّل دخولك أولًا" بالتوجيه لصفحة تسجيل الدخول
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-login-prompt")) {
    e.preventDefault();
    window.location.href = "login.html";
  }
});