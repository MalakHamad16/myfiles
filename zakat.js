// zakat.js

// دوال تحميل HTML وتهيئة شريط التنقل
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

  navLinks.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.querySelectorAll(".dropdown-toggle").forEach((item) => {
    item.addEventListener("click", function (e) {
      if (window.innerWidth <= 992) {
        e.preventDefault();
        const dropdown = this.parentNode;
        dropdown.classList.toggle("active");

        document.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== dropdown) d.classList.remove("active");
        });
      }
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) {
      navLinks.classList.remove("active");
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });
}

// متغير لتخزين أسعار الزكاة
let zakatRates = null;

// جلب أسعار الذهب والفضة من الباك-إند
async function fetchZakatRates() {
  try {
    const res = await fetch('/api/zakat/rates');
    if (res.ok) {
      zakatRates = await res.json();
    } else {
      // استخدام قيم افتراضية في حال الفشل
      zakatRates = { goldPerGram: 300, silverPerGram: 4, baseCurrency: 'ILS' };
    }
  } catch (error) {
    console.warn('فشل تحميل أسعار الزكاة، استخدام القيم الافتراضية');
    zakatRates = { goldPerGram: 300, silverPerGram: 4, baseCurrency: 'ILS' };
  }
}

// تحويل رمز العملة
function getCurrencySymbol(code) {
  const symbols = { ILS: '₪', USD: '$', JOD: 'د.أ', AED: 'د.إ' };
  return symbols[code] || '₪';
}

// سكريبت حساب الزكاة
document.addEventListener("DOMContentLoaded", async () => {
  // تحميل navbar وfooter
  loadHTML("navbar.html", "navbar-placeholder");
  loadHTML("footer.html", "footer-placeholder");

  // جلب أسعار الزكاة
  await fetchZakatRates();

  const form = document.getElementById("zakatForm");
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("resultPopup");
  const currencySelect = document.getElementById("currency");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!zakatRates) {
      alert('لم يتم تحميل أسعار الزكاة بعد. يرجى المحاولة لاحقًا.');
      return;
    }

    const selectedCurrency = currencySelect.value;
    const currencySymbol = getCurrencySymbol(selectedCurrency);

    const cash = parseFloat(document.getElementById("cash").value) || 0;
    const goldGrams = parseFloat(document.getElementById("gold").value) || 0;
    const silverGrams = parseFloat(document.getElementById("silver").value) || 0;
    const investments = parseFloat(document.getElementById("investments").value) || 0;

    // حساب القيم بالعملة الأساسية (ILS)
    const goldValue = goldGrams * zakatRates.goldPerGram;
    const silverValue = silverGrams * zakatRates.silverPerGram;
    const totalInBase = cash + goldValue + silverValue + investments;

    // النصاب = 85 جرام ذهب
    const nisab = 85 * zakatRates.goldPerGram;

    let resultHTML = "";

    if (totalInBase < nisab) {
      resultHTML = `
        <h3>لا تجب عليك الزكاة</h3>
        <p style="color: #e74c3c; margin: 1rem 0; font-size: 1.1rem;">
          مجموع أموالك (<strong>${currencySymbol}${totalInBase.toFixed(2)}</strong>) 
          أقل من نصاب الزكاة (<strong>${currencySymbol}${nisab.toLocaleString()}</strong>).
        </p>
        <p>لا يُشترط إخراج زكاة حتى يبلغ المال النصاب.</p>
      `;
    } else {
      const zakatAmount = totalInBase * 0.025;
      resultHTML = `
        <h3>إجمالي الزكاة المستحقة</h3>
        <p>المبلغ الذي أدخلته: <strong>${currencySymbol}${totalInBase.toFixed(2)}</strong></p>
        <p>مبلغ الزكاة (2.5%): <strong>${currencySymbol}${zakatAmount.toFixed(2)}</strong></p>
        <a href="DonateNow.html?type=zakat&amount=${zakatAmount.toFixed(2)}" class="btn" style="margin-top: 1rem; display: inline-block;">
          <i class="fas fa-check-circle"></i> ادفع زكاتك الآن
        </a>
      `;
    }

    popup.innerHTML = resultHTML;
    overlay.classList.add("show");
    popup.classList.add("show");

    // إعادة تعيين النموذج بعد الحساب
    form.reset();
  });

  overlay?.addEventListener("click", () => {
    overlay.classList.remove("show");
    popup.classList.remove("show");
  });
});

// تحديد نوع الصفحة قبل تحميل الشات بوت
window.pageType = "zakat";