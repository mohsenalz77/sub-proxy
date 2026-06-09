export default async (req, context) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_BASE_URL}/subdr${cleanPath}${url.search}`;

  // استخراج شناسه اشتراک (توکن) از انتهای آدرس
  const subId = cleanPath.replace(/^\//, '') || "نامشخص";

  const userAgent = req.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': userAgent }
    });

    const rawData = await response.text();
    const subInfo = response.headers.get('subscription-userinfo') || 'upload=0;download=0;total=0;expire=0';

    // استخراج و محاسبه دقیق حجم‌ها بر اساس فرمول پنل (مبنای ۱۰۰۰)
    const infoMap = Object.fromEntries(subInfo.split(';').map(item => item.split('=')));
    
    const totalBytes = parseInt(infoMap.total || 0);
    const uploadBytes = parseInt(infoMap.upload || 0);
    const downloadBytes = parseInt(infoMap.download || 0);
    const usedBytes = uploadBytes + downloadBytes;
    const remBytes = totalBytes - usedBytes;

    const totalGB = totalBytes > 0 ? (totalBytes / 1000000000).toFixed(2) : "0";
    const uploadGB = (uploadBytes / 1000000000).toFixed(2);
    const downloadGB = (downloadBytes / 1000000000).toFixed(2);
    const usedGB = (usedBytes / 1000000000).toFixed(2);
    const remGB = totalBytes > 0 ? (remBytes / 1000000000).toFixed(2) : "0";

    // محاسبه درصد مصرف ترافیک
    let percentUsed = 0;
    if (totalBytes > 0) {
      percentUsed = Math.min(((usedBytes / totalBytes) * 100), 100).toFixed(1);
    }
    
    let expireDate = "نامحدود";
    if (infoMap.expire && infoMap.expire !== "0") {
      expireDate = new Date(parseInt(infoMap.expire) * 1000).toLocaleDateString('fa-IR');
    }

    // رندر صفحه وب اختصاصی نئونی برای مرورگر
    if (isBrowser) {
      const currentUrl = req.url;
      const htmlPage = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>اشتراک SibVPN</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
              body {
                  background-color: #0d0e15;
                  color: #fff;
                  font-family: system-ui, -apple-system, sans-serif;
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
              }
              .card {
                  background: rgba(20, 21, 33, 0.8);
                  border: 1px solid #00f2fe;
                  box-shadow: 0 0 15px #00f2fe, inset 0 0 10px rgba(0, 242, 254, 0.2);
                  border-radius: 20px;
                  padding: 30px;
                  max-width: 480px;
                  width: 100%;
                  text-align: center;
                  backdrop-filter: blur(10px);
              }
              h1 {
                  color: #00f2fe;
                  text-shadow: 0 0 10px #00f2fe, 0 0 20px #4facfe;
                  font-size: 2.2rem;
                  margin-bottom: 5px;
              }
              .subtitle { color: #8a99ad; font-size: 0.9rem; margin-bottom: 25px; }
              
              /* مشخصات اشتراک */
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                  margin-bottom: 20px;
              }
              .info-item {
                  background: #16192b;
                  padding: 12px;
                  border-radius: 12px;
                  border: 1px solid #252945;
                  text-align: right;
              }
              .full-width { grid-column: span 2; }
              .info-item span { display: block; color: #8a99ad; font-size: 0.8rem; margin-bottom: 4px; }
              .info-item strong { font-size: 1rem; color: #fff; }
              .info-item.highlight border-color: #00f2fe; }
              .info-item.highlight strong { color: #00f2fe; text-shadow: 0 0 5px rgba(0,242,254,0.3); }

              /* نوار وضعیت ترافیک */
              .progress-container {
                  background: #16192b;
                  border-radius: 10px;
                  padding: 15px;
                  margin-bottom: 25px;
                  border: 1px solid #252945;
                  text-align: right;
              }
              .progress-label {
                  display: flex;
                  justify-content: space-between;
                  font-size: 0.85rem;
                  color: #8a99ad;
                  margin-bottom: 8px;
              }
              .progress-bar-bg {
                  background: #0d0e15;
                  border-radius: 8px;
                  height: 12px;
                  width: 100%;
                  overflow: hidden;
                  border: 1px solid #252945;
              }
              .progress-bar-fill {
                  background: linear-gradient(90deg, #4facfe, #00f2fe);
                  height: 100%;
                  width: ${percentUsed}%;
                  box-shadow: 0 0 10px #00f2fe;
                  transition: width 0.5s ease-in-out;
              }

              .qr-box {
                  background: white;
                  padding: 12px;
                  border-radius: 15px;
                  display: inline-block;
                  margin-bottom: 25px;
                  box-shadow: 0 0 15px #4facfe;
              }
              .btn {
                  background: linear-gradient(45deg, #00f2fe, #4facfe);
                  color: #0d0e15;
                  border: none;
                  padding: 12px 25px;
                  border-radius: 10px;
                  font-weight: bold;
                  cursor: pointer;
                  width: 100%;
                  font-size: 1rem;
                  box-shadow: 0 0 10px #00f2fe;
                  transition: 0.3s;
                  margin-bottom: 25px;
              }
              .btn:hover { transform: scale(1.01); box-shadow: 0 0 20px #00f2fe; }

              /* دکمه‌های آکاردئونی (بازشو) */
              .apps-section { border-top: 1px solid #252945; padding-top: 20px; }
              .apps-title { color: #00f2fe; font-size: 1rem; margin-bottom: 15px; }
              
              .accordion-item {
                  margin-bottom: 10px;
                  background: #16192b;
                  border: 1px solid #252945;
                  border-radius: 8px;
                  overflow: hidden;
                  text-align: right;
              }
              .accordion-header {
                  padding: 12px 15px;
                  font-size: 0.9rem;
                  font-weight: bold;
                  cursor: pointer;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  transition: 0.2s;
              }
              .accordion-header:hover { background: rgba(79, 172, 254, 0.05); color: #00f2fe; }
              .accordion-content {
                  max-height: 0;
                  overflow: hidden;
                  transition: max-height 0.3s ease-out;
                  background: #0d0e15;
                  display: flex;
                  flex-direction: column;
              }
              .sub-link {
                  padding: 10px 20px;
                  color: #8a99ad;
                  text-decoration: none;
                  font-size: 0.85rem;
                  border-top: 1px solid #16192b;
                  transition: 0.2s;
              }
              .sub-link:hover { color: #00f2fe; background: rgba(0, 242, 254, 0.05); padding-right: 25px; }
              .accordion-item.active .accordion-content {
                  max-height: 200px; /* فضای کافی برای لینک‌ها */
              }
              .accordion-item.active .accordion-header {
                  border-bottom: 1px solid #252945;
                  color: #00f2fe;
              }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>SibVPN</h1>
              <div class="subtitle">وضعیت اشتراک هوشمند شما</div>
              
              <div class="info-grid">
                  <div class="info-item full-width"><span>شناسه اشتراک</span><strong>${subId}</strong></div>
                  <div class="info-item highlight"><span>حجم کل اشتراک</span><strong>${totalGB} GB</strong></div>
                  <div class="info-item highlight"><span>حجم باقی‌مانده</span><strong>${remGB} GB</strong></div>
                  <div class="info-item"><span>کل ترافیک مصرفی</span><strong>${usedGB} GB</strong></div>
                  <div class="info-item"><span>تاریخ اتمام اعتبار</span><strong>${expireDate}</strong></div>
                  <div class="info-item"><span>میزان دانلود</span><strong>${downloadGB} GB</strong></div>
                  <div class="info-item"><span>میزان آپلود</span><strong>${uploadGB} GB</strong></div>
              </div>

              <div class="progress-container">
                  <div class="progress-label">
                      <span>وضعیت مصرف ترافیک</span>
                      <span>${percentUsed}%</span>
                  </div>
                  <div class="progress-bar-bg">
                      <div class="progress-bar-fill"></div>
                  </div>
              </div>

              <div class="qr-box"><div id="qrcode"></div></div>

              <button class="btn" onclick="copyLink()">کپی لینک اشتراک</button>

              <div class="apps-section">
                  <div class="apps-title">راهنمای اتصال و دانلود نرم‌افزارها</div>
                  
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🤖 سیستم‌عامل اندروید <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2TakeR1/v2rayNG/releases" target="_blank" class="sub-link">📥 دانلود v2rayNG (لینک مستقیم گیت‌هاب)</a>
                          <a href="https://play.google.com/store/apps/details?v=com.v2ray.ang" target="_blank" class="sub-link">🏪 دانلود v2rayNG از گوگل پلی</a>
                          <a href="https://github.com/MatsuriDayo/NekoBoxForAndroid/releases" target="_blank" class="sub-link">📥 دانلود NekoBox (حرفه‌ای)</a>
                      </div>
                  </div>

                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🍏 سیستم‌عامل iOS (آیفون/آیپد) <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://apps.apple.com/us/app/streisand/id6450534064" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن Streisand</a>
                          <a href="https://apps.apple.com/us/app/v2box-v2ray-client/id1640566424" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن V2Box</a>
                      </div>
                  </div>

                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">💻 سیستم‌عامل ویندوز (کامپیوتر) <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2TakeR1/v2rayN/releases" target="_blank" class="sub-link">📥 دانلود v2rayN (لینک مستقیم)</a>
                          <a href="https://github.com/NekoBoxDevel/NekoBoxForPC/releases" target="_blank" class="sub-link">📥 دانلود نسخه ویندوز NekoBox</a>
                      </div>
                  </div>

              </div>
          </div>

          <script>
              new QRCode(document.getElementById("qrcode"), {
                  text: "${currentUrl}",
                  width: 160,
                  height: 160
              });

              function copyLink() {
                  navigator.clipboard.writeText("${currentUrl}");
                  alert("لینک اشتراک SibVPN با موفقیت کپی شد!");
              }

              function toggleAccordion(header) {
                  const item = header.parentElement;
                  const isActive = item.classList.contains('active');
                  
                  // بستن بقیه منوها
                  document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));
                  
                  if (!isActive) {
                      item.classList.add('active');
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(htmlPage, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'profile-title': 'SibVPN'
    });

    if (response.headers.get('subscription-userinfo')) {
      headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    }
    
    return new Response(rawData, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
