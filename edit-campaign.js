// edit-campaign.js
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('id');
  if (!campaignId) {
    alert('لم يتم تحديد حملة للتعديل');
    window.location.href = 'campaigns.html';
    return;
  }

  const campaignCode = document.getElementById('campaignCode');
  const title = document.getElementById('title');
  const goal = document.getElementById('goal');
  const currencySelect = document.getElementById('currency');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const calculatedDuration = document.getElementById('calculatedDuration');
  const statusDisplay = document.getElementById('statusDisplay');
  const description = document.getElementById('description');
  const editForm = document.getElementById('editForm');
  const successMsg = document.getElementById('successMsg');
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('imagePreview');
  const cancelBtn = document.getElementById('cancelBtn');
  const pauseYesBtn = document.getElementById('pauseYes');
  const pauseNoBtn = document.getElementById('pauseNo');

  let originalData = null;
  let isPending = false;

  async function loadCampaignData() {
  try {
    const res = await fetch(`/api/campaigns/${campaignId}`);
    if (!res.ok) throw new Error('الحملة غير موجودة');
    const camp = await res.json();
    originalData = camp;

    campaignCode.value = camp._id.substring(0, 6).toUpperCase();
    title.value = camp.title;
    goal.value = camp.goalAmount;
    currencySelect.value = camp.currency || 'ILS';
    
    // ✅ تحويل التاريخ من ISO إلى YYYY-MM-DD
    startDate.value = camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : '';
    endDate.value = camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : '';
    
    description.value = camp.description;
    isPending = camp.status === 'pending';
    updateStatusDisplay();
    imagePreview.innerHTML = `<img src="${camp.image || 'images/default.jpg'}" alt="صورة الحملة" style="width:100%;height:auto;border-radius:5px;">`;
    updateDuration();
  } catch (err) {
    console.error(err);
    alert('فشل تحميل بيانات الحملة');
    window.location.href = 'campaigns.html';
  }
}
  function updateStatusDisplay() {
    if (isPending) {
      statusDisplay.value = 'معلقة';
      pauseYesBtn.style.backgroundColor = '#f59e0b';
      pauseNoBtn.style.backgroundColor = '#d1d5db';
    } else {
      const today = new Date().toISOString().split('T')[0];
      const displayText = startDate.value <= today ? 'نشطة' : 'مجدولة';
      statusDisplay.value = displayText;
      pauseYesBtn.style.backgroundColor = '#d1d5db';
      pauseNoBtn.style.backgroundColor = '#4ecdc4';
    }
  }

  function updateDuration() {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    if (start && end && end >= start) {
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      let durationText = diffDays < 30 ? `${diffDays} يوم`
        : diffDays < 365 ? `${Math.floor(diffDays / 30)} شهر`
        : `${Math.floor(diffDays / 365)} سنة`;
      calculatedDuration.value = durationText;
      calculatedDuration.style.color = 'black';
      return true;
    } else {
      calculatedDuration.value = '❌ التاريخ غير صحيح!';
      calculatedDuration.style.color = 'red';
      return false;
    }
  }

  pauseYesBtn.addEventListener('click', () => {
    isPending = true;
    updateStatusDisplay();
  });

  pauseNoBtn.addEventListener('click', () => {
    isPending = false;
    updateStatusDisplay();
  });

  startDate.addEventListener('change', () => { updateDuration(); updateStatusDisplay(); });
  endDate.addEventListener('change', () => { updateDuration(); updateStatusDisplay(); });

  cancelBtn.addEventListener('click', () => {
    if (originalData) loadCampaignData();
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!updateDuration()) return;

    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('description', description.value);
    formData.append('goalAmount', goal.value);
    formData.append('currency', currencySelect.value);
    formData.append('startDate', startDate.value);
    formData.append('endDate', endDate.value);
    
    const finalStatus = isPending ? 'pending' : 'active';
    formData.append('status', finalStatus);

    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }
     
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        successMsg.style.display = 'block';
        setTimeout(() => window.location.href = 'campaigns.html', 2000);
      } else {
        const err = await res.json();
        alert('❌ فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ خطأ في الاتصال بالسيرفر');
    }
  });

  await loadCampaignData();
});