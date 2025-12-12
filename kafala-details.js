// kafala-details.js
let currentCase = null;

//  دالة مساعدة: الحصول على المستخدم الحالي
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user')) ||
         JSON.parse(sessionStorage.getItem('user')) ||
         null;
}

async function loadCaseDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  if (!id) {
    showError("لم يتم تحديد حالة للكفالة.");
    return;
  }

  try {
    const res = await fetch(`/api/sponsorships/${id}`);
    const data = await res.json();
    if (data.success && data.sponsorship) {
      currentCase = data.sponsorship;
      displayCase(data.sponsorship);
    } else {
      showError("الحالة المطلوبة غير موجودة.");
    }
  } catch (err) {
    console.error(err);
    showError("حدث خطأ أثناء تحميل التفاصيل.");
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

function getTypeText(type) {
  const map = {
    orphans: "أيتام وأطفال",
    educational: "تعليمية",
    health: "صحية",
    living: "معيشية",
    general: "شاملة", 
  };
  return map[type] || type;
}

//  تحديث: عرض درجة الاستعجال بالعربية + مبلغ مع periodLabel
function displayCase(caseItem) {
  document.getElementById("caseTitle").textContent = `أهلاً، أنا ${caseItem.firstName}`;
  document.getElementById("caseImage").src = getImagePath(caseItem.type);
  document.getElementById("caseId").textContent = `رقم الحالة: ${caseItem.caseId}`;
  document.getElementById("caseDescription").textContent = caseItem.shortDescription;
  document.getElementById("caseType").textContent = getTypeText(caseItem.type);
  
  //  عرض المبلغ كـ "100 ₪/شهريًا"
  document.getElementById("totalAmount").textContent = 
    `${caseItem.amountPerPeriod} ₪/${caseItem.periodLabel}`;
  
  document.getElementById("duration").textContent = caseItem.durationLabel;
  document.getElementById("city").textContent = caseItem.city;
  
  document.getElementById("endDate").textContent = 
    new Date(caseItem.preferredSponsorshipDeadline)
      .toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  
  //  عرض عدد الفترات المدفوعة
  document.getElementById("paidPeriods").textContent = caseItem.paidPeriods || 0;

  //  عرض درجة الاستعجال بالعربية
  const urgencyMap = {
    critical: 'طارئ',
    high: 'عاجل',
    medium: 'مهم',
    low: 'عادي'
  };
  document.getElementById("urgencyLevel").textContent = 
    urgencyMap[caseItem.urgencyLevel] || 'عادي';

  //  ختم الحالة
  const badge = document.getElementById("statusBadge");
  const badgeText = document.getElementById("statusBadgeText");
  if (caseItem.status === "fully sponsored") {
    badge.className = "status-badge fully-sponsored";
    badgeText.textContent = "مكفولة بنجاح";
    badge.style.display = "flex";
  } else if (caseItem.status === "partially sponsored") {
    badge.className = "status-badge partially-sponsored";
    badgeText.textContent = "مكفولة جزئياً";
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }

  //  زر "اكفل الآن" — تفعيل حسب الحالة + هوية الكفيل
  const sponsorLink = document.getElementById("sponsorLink");
  const currentUser = getCurrentUser();

  if (caseItem.status === "fully sponsored") {
    sponsorLink.classList.add("disabled");
    sponsorLink.style.opacity = "0.6";
    sponsorLink.style.pointerEvents = "none";
    sponsorLink.innerHTML = '<i class="fas fa-check"></i> تم الكفالة';

  } else if (caseItem.status === "partially sponsored") {
    if (currentUser && currentUser.id === caseItem.sponsorId) {
      // الكفيل الحالي → يسمح له بالدفع
      sponsorLink.href = `DonateNow.html?type=sponsor&id=${caseItem._id}`;
      sponsorLink.classList.remove("disabled");
      sponsorLink.style.opacity = "1";
      sponsorLink.style.pointerEvents = "auto";
      sponsorLink.innerHTML = '<i class="fas fa-hand-holding-usd"></i> ادفع الدفعة القادمة';
    } else {
      // غير الكفيل → معطّل
      sponsorLink.classList.add("disabled");
      sponsorLink.style.opacity = "0.6";
      sponsorLink.style.pointerEvents = "none";
      sponsorLink.innerHTML = '<i class="fas fa-user-check"></i> مكفولة جزئياً';
    }

  } else {
  // غير مكفولة → يُفعّل فقط للمستخدم المسجّل
  if (currentUser && currentUser.id) {
    sponsorLink.href = `DonateNow.html?type=sponsor&id=${caseItem._id}`;
    sponsorLink.classList.remove("disabled", "btn-login-prompt");
    sponsorLink.style.opacity = "1";
    sponsorLink.style.cursor = "pointer";
    sponsorLink.innerHTML = '<i class="fas fa-hands-helping"></i> اكفل الآن';
  } else {
    // زائر: زر "تسجيل دخول" قابل للنقر
    sponsorLink.href = "login.html"; // أو أي رابط تفضله
    sponsorLink.classList.add("btn-login-prompt");
    sponsorLink.classList.remove("disabled");
    sponsorLink.style.opacity = "0.85";
    sponsorLink.style.cursor = "pointer";
    sponsorLink.innerHTML = '<i class="fas fa-lock"></i> سجّل دخولك أولًا';
  }
}
}

function showError(msg) {
  document.querySelector(".kafala-card").innerHTML = 
    `<div class="alert alert-danger text-center m-4">${msg}</div>`;
}

//  دالة مشاركة موحدة
function shareCurrentCase() {
  if (!currentCase) {
    alert("لا يمكن مشاركة الكفالة حالياً. يرجى إعادة تحميل الصفحة.");
    return;
  }
  const url = `${window.location.origin}/SponsorNow.html?type=sponsorship&needyID=${currentCase._id}`;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <h3>مشاركة الكفالة: ${currentCase.firstName}</h3>
      <div class="share-icons">
        <a href="https://wa.me/?text=${encodeURIComponent(url)}" target="_blank"><i class="fab fa-whatsapp"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank"><i class="fab fa-facebook"></i></a>
        <button onclick="navigator.clipboard.writeText('${url}'); alert('تم نسخ الرابط')"><i class="fas fa-link"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// تشغيل عند التحميل
document.addEventListener("DOMContentLoaded", () => {
  loadCaseDetails();
});