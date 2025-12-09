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

//  دالة التحقق من تسجيل الدخول
function isUserLoggedIn() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
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

// تحديث حالة الزر في .hero-card بعد تحميل الصفحة
function updateHeroButton() {
  const heroBtn = document.querySelector('.hero-card .btn');
  if (!heroBtn) return;

  if (isUserLoggedIn()) {
    heroBtn.disabled = false;
    heroBtn.classList.remove('btn-disabled');
    heroBtn.title = '';
    heroBtn.href = "DonateNow.html";
  } else {
    heroBtn.disabled = true;
    heroBtn.classList.add('btn-disabled');
    heroBtn.title = "يرجى تسجيل الدخول أولاً";
    heroBtn.removeAttribute('href');
    heroBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'login.html'; //  تحويل مباشر
    });
  }
}

// سكريبت حساب الزكاة
document.addEventListener("DOMContentLoaded", async () => {
  // تحميل navbar وfooter
  await loadHTML("navbar.html", "navbar-placeholder");
  await loadHTML("footer.html", "footer-placeholder");

  // جلب أسعار الزكاة
  await fetchZakatRates();

  // تحديث زر البطل
  updateHeroButton();

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

    const goldValue = goldGrams * zakatRates.goldPerGram;
    const silverValue = silverGrams * zakatRates.silverPerGram;
    const totalInBase = cash + goldValue + silverValue + investments;

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

      let payButtonHTML = '';
      if (isUserLoggedIn()) {
        payButtonHTML = `
          <a href="DonateNow.html?type=zakat&amount=${zakatAmount.toFixed(2)}" class="btn" style="margin-top: 1rem; display: inline-block;">
            <i class="fas fa-check-circle"></i> ادفع زكاتك الآن
          </a>
        `;
      } else {
        payButtonHTML = `
          <button class="btn btn-disabled" style="margin-top: 1rem; display: inline-block;" disabled>
            <i class="fas fa-lock"></i> سجّل الدخول أولاً
          </button>
        `;
      }

      resultHTML = `
        <h3>إجمالي الزكاة المستحقة</h3>
        <p>المبلغ الذي أدخلته: <strong>${currencySymbol}${totalInBase.toFixed(2)}</strong></p>
        <p>مبلغ الزكاة (2.5%): <strong>${currencySymbol}${zakatAmount.toFixed(2)}</strong></p>
        ${payButtonHTML}
      `;
    }

    popup.innerHTML = resultHTML;
    overlay.classList.add("show");
    popup.classList.add("show");

    form.reset();

    // عند النقر على الزر المعطل في النتيجة — تحويل مباشر 
    if (!isUserLoggedIn()) {
      const disabledBtn = popup.querySelector('.btn-disabled');
      if (disabledBtn) {
        disabledBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'login.html';
        });
      }
    }
  });

  overlay?.addEventListener("click", () => {
    overlay.classList.remove("show");
    popup.classList.remove("show");
  });
});

// تحديد نوع الصفحة
window.pageType = "zakat";