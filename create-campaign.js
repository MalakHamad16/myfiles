// create-campaign.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('campaignForm');
  const successMsg = document.getElementById('successMsg');
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('imagePreview');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const durationField = document.getElementById('calculatedDuration');
  const campaignCodeField = document.getElementById('campaignCode');
  const statusDisplay = document.getElementById('statusDisplay');

  // لا حاجة لتوليد رقم تسلسلي — سيُولّد تلقائيًا في الباك-إند
  campaignCodeField.value = 'سيُولّد تلقائيًا';

  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.innerHTML = `<img src="${ev.target.result}" alt="معاينة" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '<i class="fas fa-image"></i>';
    }
  });

  function updateDuration() {
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      if (end >= start) {
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        let durationText = diffDays < 30 ? `${diffDays} يوم`
          : diffDays < 365 ? `${Math.floor(diffDays / 30)} شهر`
          : `${Math.floor(diffDays / 365)} سنة`;
        durationField.value = durationText;
        durationField.style.color = 'black';
        return true;
      } else {
        durationField.value = '❌ التاريخ غير صحيح!';
        durationField.style.color = 'red';
        return false;
      }
    } else {
      durationField.value = '';
      return false;
    }
  }

  function updateStatus() {
    if (!startDate.value) return;
    const today = new Date().toISOString().split('T')[0];
    statusDisplay.value = startDate.value <= today ? 'نشطة' : 'مجدولة';
  }

  startDate.addEventListener('change', () => { updateDuration(); updateStatus(); });
  endDate.addEventListener('change', () => { updateDuration(); updateStatus(); });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!updateDuration()) return;

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('goalAmount', document.getElementById('goal').value);
    formData.append('startDate', startDate.value);
    formData.append('endDate', endDate.value);
    formData.append('currency', document.getElementById('currency').value);
    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }
    
   

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: formData
      });
     
      const data = await res.json();
      if (res.ok) {
        successMsg.style.display = 'block';
        setTimeout(() => window.location.href = 'campaigns.html', 2000);
      } else {
        alert('❌ فشل إنشاء الحملة: ' + (data.message || 'خطأ غير معروف'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ خطأ في الاتصال بالسيرفر');
    }
  });
});