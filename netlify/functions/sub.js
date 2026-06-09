export default async (req, context) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 
  
  // ⚠️ آیدی تلگرام پشتیبانی و کانال خود را اینجا بدون @ وارد کنید:
  const TELEGRAM_SUPPORT = 'Sibvpn_support'; 
  const TELEGRAM_CHANNEL = 'sibvpn'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_BASE_URL}/subdr${cleanPath}${url.search}`;
  const subId = cleanPath.replace(/^\//, '') || "نامشخص";

  const userAgent = req.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': userAgent }
    });

    const rawData = await response.text();
    const subInfo = response.headers.get('subscription-userinfo') || response.headers.get('Subscription-Userinfo') || '';

    let uploadBytes = 0, downloadBytes = 0, totalBytes = 0, expireTimestamp = 0;
    if (subInfo) {
      subInfo.split(';').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key?.trim() === 'upload') uploadBytes = parseInt(value) || 0;
        if (key?.trim() === 'download') downloadBytes = parseInt(value) || 0;
        if (key?.trim() === 'total') totalBytes = parseInt(value) || 0;
        if (key?.trim() === 'expire') expireTimestamp = parseInt(value) || 0;
      });
    }

    const usedBytes = uploadBytes + downloadBytes;
    const remBytes = totalBytes > usedBytes ? (totalBytes - usedBytes) : 0;

    const totalGB = totalBytes > 0 ? (totalBytes / (1024 ** 3)).toFixed(2) : "0.00";
    const uploadGB = (uploadBytes / (1024 ** 3)).toFixed(2);
    const downloadGB = (downloadBytes / (1024 ** 3)).toFixed(2);
    const usedGB = (usedBytes / (1024 ** 3)).toFixed(2);
    const remGB = totalBytes > 0 ? (remBytes / (1024 ** 3)).toFixed(2) : "0.00";

    let percentUsed = 0;
    if (totalBytes > 0) {
      percentUsed = Math.min(((usedBytes / totalBytes) * 100), 100).toFixed(1);
    }
    
    // تعیین رنگ نوار حجم بر اساس میزان مصرف
    let progressBarColor = "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)"; // فیروزه‌ای (پیش‌فرض زیر ۵۰ درصد)
    if (percentUsed >= 50 && percentUsed < 80) {
      progressBarColor = "linear-gradient(90deg, #f7971e 0%, #ffd200 100%)"; // نارنجی (بین ۵۰ تا ۸۰ درصد)
    } else if (percentUsed >= 80) {
      progressBarColor = "linear-gradient(90deg, #ff007f 0%, #ff0055 100%)"; // قرمز (بالای ۸۰ درصد)
    }
    
    let expireDate = "نامحدود";
    if (expireTimestamp > 0 && expireTimestamp < 253402300799) {
      expireDate = new Date(expireTimestamp * 1000).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
    }

    let realLastActivity = "";
    let isPanelDisabled = false;
    
    try {
      const decodedText = Buffer.from(rawData.trim(), 'base64').toString('utf-8');
      if (decodedText.includes('N/A') || decodedText.includes('disabled') || decodedText.includes('Disabled') || decodedText.includes('⛔') || decodedText.includes('🛑') || decodedText.includes('%E2%9B%94')) {
        isPanelDisabled = true;
      }

      const lines = decodedText.split('\n');
      for (let line of lines) {
        if (line.includes('activity') || line.includes('last') || line.includes('%D9%81%D8%B9%D8%A7%D9%84%D9%8A%D8%AA')) { 
          const decodedLine = decodeURIComponent(line);
          if (decodedLine.includes('#')) {
            realLastActivity = decodedLine.split('#')[1].trim();
            break;
          }
        }
      }
    } catch (e) {}

    if (!realLastActivity) {
      const now = new Date();
      const options = { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const dateOptions = { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' };
      realLastActivity = `${now.toLocaleDateString('fa-IR', dateOptions)}، ساعت ${now.toLocaleTimeString('fa-IR', options)}`;
    }

    const isUserActive = response.status === 200 && (totalBytes === 0 || remBytes > 0) && !isPanelDisabled;
    const statusText = isUserActive ? "اشتراک فعال و متصل" : "اشتراک غیرفعال / منقضی شده";
    const statusColor = isUserActive ? "#00f2fe" : "#ff007f";

    if (isBrowser) {
      const currentUrl = req.url;
      const htmlPage = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>داشبورد اختصاصی SibVPN</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700&display=swap');
              body { background: radial-gradient(circle at 50% 50%, #121526 0%, #050609 100%); color: #f1f3f9; font-family: 'Vazirmatn', system-ui, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; line-height: 1.6; }
              .card { background: rgba(13, 16, 33, 0.65); border: 1px solid rgba(0, 242, 254, 0.4); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.15); border-radius: 28px; padding: 40px 30px; max-width: 470px; width: 100%; text-align: center; backdrop-filter: blur(20px); }
              h1 { color: #00f2fe; text-shadow: 0 0 15px rgba(0, 242, 254, 0.6); font-size: 2.8rem; font-weight: 700; margin: 0; }
              .brand-badge { font-size: 0.75rem; background: rgba(0, 242, 254, 0.1); border: 1px solid #00f2fe; color: #00f2fe; padding: 2px 10px; border-radius: 10px; display: inline-block; margin-bottom: 5px; text-transform: uppercase; font-weight: 700; }
              .subtitle { color: #6f7d99; font-size: 0.95rem; margin-bottom: 30px; }
              .status-badge { display: inline-flex; align-items: center; gap: 12px; background: rgba(18, 22, 43, 0.7); padding: 10px 24px; border-radius: 50px; border: 1px solid ${statusColor}; font-size: 0.9rem; margin-bottom: 30px; box-shadow: 0 0 10px rgba(${isUserActive ? '0,242,254' : '255,0,127'}, 0.2); }
              .status-dot { width: 9px; height: 9px; background-color: ${statusColor}; border-radius: 50%; box-shadow: 0 0 12px ${statusColor}, 0 0 25px ${statusColor}; animation: neonPulse 2s infinite ease-in-out; }
              @keyframes neonPulse { 0%, 100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 15px ${statusColor}; } }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 25px; }
              .info-item { background: rgba(22, 27, 54, 0.5); padding: 14px 16px; border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.05); text-align: right; }
              .full-width { grid-column: span 2; }
              .info-item span { display: block; color: #7687a6; font-size: 0.8rem; font-weight: 300; margin-bottom: 6px; }
              .info-item strong { font-size: 1rem; color: #ffffff; }
              .info-item.highlight { border-color: rgba(0, 242, 254, 0.3); background: rgba(0, 242, 254, 0.02); }
              .info-item.highlight strong { color: #00f2fe; font-weight: 700; }
              .progress-container { background: rgba(22, 27, 54, 0.5); border-radius: 18px; padding: 20px; margin-bottom: 35px; border: 1px solid rgba(255, 255, 255, 0.05); text-align: right; }
              .progress-label { display: flex; justify-content: space-between; font-size: 0.9rem; color: #7687a6; margin-bottom: 12px; }
              .progress-usage { color: #00f2fe; font-weight: bold; }
              .progress-bar-bg { background: #07080f; border-radius: 12px; height: 14px; width: 100%; overflow: hidden; display: flex; justify-content: flex-start; direction: ltr; }
              .progress-bar-fill { background: ${progressBarColor}; height: 100%; width: ${percentUsed}%; box-shadow: 0 0 15px rgba(0, 242, 254, 0.3); transition: width 0.5s; }
              .qr-box { background: white; padding: 16px; border-radius: 20px; display: inline-block; margin-bottom: 35px; border: 2px solid #00f2fe; }
              .btn { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #050609; border: none; padding: 15px 25px; border-radius: 14px; font-weight: 700; cursor: pointer; width: 100%; font-size: 1.05rem; box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3); margin-bottom: 35px; font-family: 'Vazirmatn', sans-serif; }
              
              .apps-section { border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 30px; margin-bottom: 25px; }
              .apps-title { color: #00f2fe; font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
              .accordion-item { margin-bottom: 14px; background: rgba(22, 27, 54, 0.3); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 14px; overflow: hidden; text-align: right; }
              .accordion-header { padding: 15px 20px; font-size: 0.95rem; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
              .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; background: rgba(5, 6, 9, 0.4); display: flex; flex-direction: column; }
              .sub-link { padding: 14px 22px; color: #a2b1cd; text-decoration: none; font-size: 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.03); }
              .sub-link:hover { color: #00f2fe; background: rgba(0, 242, 254, 0.03); padding-right: 28px; }
              .accordion-item.active .accordion-content { max-height: 250px; }
              .accordion-item.active .accordion-header { color: #00f2fe; }
              
              /* دکمه‌های جدید پشتیبانی تلگرام و کانال */
              .tg-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 25px; }
              .tg-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(22, 27, 54, 0.6); border: 1px solid #24A1DE; color: #fff; padding: 12px; border-radius: 14px; text-decoration: none; font-size: 0.9rem; font-weight: bold; transition: all 0.2s; }
              .tg-btn:hover { background: #24A1DE; color: #050609; box-shadow: 0 0 15px rgba(36, 161, 222, 0.4); }
              .tg-btn.channel { border-color: #9d4edd; }
              .tg-btn.channel:hover { background: #9d4edd; box-shadow: 0 0 15px rgba(157, 78, 221, 0.4); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="brand-badge">Official Client</div>
              <h1>SibVPN</h1>
              <div class="subtitle">سامانه مدیریت هوشمند اشتراک کاربری</div>
              
              <div class="status-badge">
                  <div class="status-dot"></div>
                  <span>وضعیت اتصال: <strong>${statusText}</strong></span>
              </div>

              <div class="info-grid">
                  <div class="info-item full-width"><span>شناسه کاربری</span><strong>${subId}</strong></div>
                  <div class="info-item full-width highlight"><span>آخرین فعالیت</span><strong>${realLastActivity}</strong></div>
                  <div class="info-item highlight"><span>حجم کل دوره</span><strong>${totalGB} GB</strong></div>
                  <div class="info-item highlight"><span>حجم باقی‌مانده</span><strong>${remGB} GB</strong></div>
                  <div class="info-item"><span>تاریخ اتمام اعتبار</span><strong>${expireDate}</strong></div>
                  <div class="info-item"><span>کل ترافیک مصرفی</span><strong>${usedGB} GB</strong></div>
                  <div class="info-item"><span>میزان دانلود</span><strong>${downloadGB} GB</strong></div>
                  <div class="info-item"><span>میزان آپلود</span><strong>${uploadGB} GB</strong></div>
              </div>

              <div class="progress-container">
                  <div class="progress-label">
                      <span>میزان مصرف: <span class="progress-usage">${usedGB} GB</span> / ${totalGB} GB</span>
                      <span>${percentUsed}%</span>
                  </div>
                  <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
              </div>

              <div class="qr-box"><div id="qrcode"></div></div>
              <button class="btn" onclick="copyLink()">کپی لینک سابسکریپشن SibVPN</button>

              <div class="apps-section">
                  <div class="apps-title">📥 دانلود نرم‌افزارهای SibVPN</div>
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🤖 سیستم‌عامل اندروید <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2dust/v2rayNG/releases/download/2.2.3/v2rayNG_2.2.3_universal.apk" target="_blank" class="sub-link">📥 دانلود v2rayNG (لینک مستقیم)</a>
                          <a href="https://play.google.com/store/apps/details?id=dev.hexasoftware.v2box" target="_blank" class="sub-link">🏪 دانلود v2box از گوگل پلی</a>
                      </div>
                  </div>
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🍏 سیستم‌عامل iOS (آیفون / آیپد) <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://apps.apple.com/us/app/streisand/id6450534064" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن Streisand</a>
                          <a href="https://apps.apple.com/us/app/v2box-v2ray-client/id6446814690" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن V2Box</a>
                      </div>
                  </div>
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">💻 سیستم‌عامل ویندوز (کامپیوتر) <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2dust/v2rayN/releases/download/7.22.5/v2rayN-windows-64.zip" target="_blank" class="sub-link">📥 دانلود v2rayN (نسخه رسمی کامپیوتر)</a>
                      </div>
                  </div>
              </div>

              <div class="tg-section">
                  <a href="https://t.me/${TELEGRAM_SUPPORT}" target="_blank" class="tg-btn">✈️ پشتیبانی تلگرام</a>
                  <a href="https://t.me/${TELEGRAM_CHANNEL}" target="_blank" class="tg-btn channel">📢 کانال اطلاع‌رسانی</a>
              </div>
          </div>
          <script>
              new QRCode(document.getElementById("qrcode"), { text: "${currentUrl}", width: 160, height: 160 });
              function copyLink() { navigator.clipboard.writeText("${currentUrl}"); alert("لینک اشتراک SibVPN کپی شد!"); }
              function toggleAccordion(header) {
                  const item = header.parentElement;
                  const isActive = item.classList.contains('active');
                  document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));
                  if (!isActive) item.classList.add('active');
              }
          </script>
      </body>
      </html>
      `;
      return new Response(htmlPage, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'profile-title': 'SibVPN'
    });
    if (response.headers.get('subscription-userinfo')) headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    return new Response(rawData, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
