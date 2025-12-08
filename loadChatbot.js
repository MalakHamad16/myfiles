// loadChatbot.js
(function () {
  const CHATBOT_ID = "givehope-chatbot";

  // ✅ حذف الشات بوت القديم إذا وُجد
  const oldChatbot = document.getElementById(CHATBOT_ID);
  if (oldChatbot) {
    oldChatbot.remove();
    const oldCSS = document.querySelector('link[href$="chatbot/chatbot.css"]');
    if (oldCSS) oldCSS.remove();
  }

  // ✅ اقرأ نوع الصفحة من window.pageType
  const currentPageType = window.pageType || "default";

  fetch("chatbot/chatbot.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.createElement("div");
      container.id = CHATBOT_ID;
      container.innerHTML = html;
      document.body.appendChild(container);

      // تحميل CSS
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "chatbot/chatbot.css";
      document.head.appendChild(css);

      // ✅ تمرير currentPageType إلى الشات بوت عبر متغير عام
      window.chatbotPageType = currentPageType;

      // تحميل JS
      const js = document.createElement("script");
      js.src = "chatbot/chatbot.js";
      js.onload = function () {
        if (typeof initializeChatbot === "function") {
          initializeChatbot();
        }
      };
      document.body.appendChild(js);
    });
})();
