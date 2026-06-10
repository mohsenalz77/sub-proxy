export const config = {
  runtime: 'edge'
};

export default async (req) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 
  
  const TELEGRAM_SUPPORT = 'Sibvpn_support'; 
  const TELEGRAM_CHANNEL = 'sibvpn'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname; 
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
    
    let progressBarColor = "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)"; 
    if (percentUsed >= 50 && percentUsed < 80) {
      progressBarColor = "linear-gradient(90deg, #f7971e 0%, #ffd200 100%)"; 
    } else if (percentUsed >= 80) {
      progressBarColor = "linear-gradient(90deg, #ff007f 0%, #ff0055 100%)"; 
    }
    
    let expireDate = "نامحدود";
    if (expireTimestamp > 0 && expireTimestamp < 253402300799) {
      expireDate = new Date(expireTimestamp * 1000).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
    }

    let realLastActivity = "";
    let isPanelDisabled = false;
    
    try {
      const decodedText = atob(rawData.trim());
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
      const htmlPage = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>داشبورد اختصاصی SibVPN</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;700&display=swap');
              body { background: radial-gradient(circle at 50% 50%, #121526 0%, #050609 100%); color: #f1f3f9; font-family: 'Vazirmatn', system-ui, sans-serif; margin: 0; padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 100vh; line-height: 1.5; box-sizing: border-box; }
              .card { background: rgba(13, 16, 33, 0.7); border: 1px solid rgba(0, 242, 254, 0.35); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 242, 254, 0.1); border-radius: 22px; padding: 25px 20px; max-width: 440px; width: 100%; text-align: center; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); box-sizing: border-box; }
              h1 { color: #00f2fe; text-shadow: 0 0 10px rgba(0, 242, 254, 0.5); font-size: 2.2rem; font-weight: 700; margin: 0; }
              .brand-badge { font-size: 0.7rem; background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.6); color: #00f2fe; padding: 1px 8px; border-radius: 8px; display: inline-block; margin-bottom: 4px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
              .subtitle { color: #6f7d99; font-size: 0.85rem; margin-bottom: 20px; font-weight: 300; }
              .status-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(18, 22, 43, 0.8); padding: 8px 18px; border-radius: 50px; border: 1px solid ${statusColor}; font-size: 0.8rem; margin-bottom: 22px; box-shadow: 0 0 8px rgba(${isUserActive ? '0,242,254' : '255,0,127'}, 0.15); }
              .status-dot { width: 8px; height: 8px; background-color: ${statusColor}; border-radius: 50%; box-shadow: 0 0 10px ${statusColor}; animation: neonPulse 2s infinite ease-in-out; }
              @keyframes neonPulse { 0%, 100% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .info-item { background: rgba(22, 27, 54, 0.45); padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.03); text-align: right; }
              .full-width { grid-column: span 2; }
              .info-item span { display: block; color: #7687a6; font-size: 0.75rem; font-weight: 300; margin-bottom: 3px; }
              .info-item strong { font-size: 0.9rem; color: #ffffff; font-weight: 400; word-break: break-all; }
              .info-item.highlight { border-color: rgba(0, 242, 254, 0.25); background: rgba(0, 242, 254, 0.01); }
              .info-item.highlight strong { color: #00f2fe; font-weight: 700; }
              .progress-container { background: rgba(22, 27, 54, 0.45); border-radius: 14px; padding: 14px; margin-bottom: 25px; border: 1px solid rgba(255, 255, 255, 0.03); text-align: right; }
              .progress-label { display: flex; justify-content: space-between; font-size: 0.8rem; color: #7687a6; margin-bottom: 8px; }
              .progress-usage { color: #00f2fe; font-weight: 700; }
              .progress-bar-bg { background: #07080f; border-radius: 10px; height: 11px; width: 100%; overflow: hidden; display: flex; justify-content: flex-start; direction: ltr; }
              .progress-bar-fill { background: ${progressBarColor}; height: 100%; width: ${percentUsed}%; box-shadow: 0 0 10px rgba(0, 242, 254, 0.4); transition: width 0.5s; }
              .qr-box { background: white; padding: 10px; border-radius: 14px; display: inline-block; margin-bottom: 25px; border: 1px solid rgba(0, 242, 254, 0.5); }
              .qr-box canvas, .qr-box img { width: 130px !important; height: 130px !important; }
              .btn { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); color: #050609; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0, 242, 254, 0.25); margin-bottom: 25px; font-family: 'Vazirmatn', sans-serif; }
              .apps-section { border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 22px; margin-bottom: 22px; }
              .apps-title { color: #00f2fe; font-size: 0.95rem; font-weight: 700; margin-bottom: 14px; }
              .accordion-item { margin-bottom: 10px; background: rgba(22, 27, 54, 0.25); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: 10px; overflow: hidden; text-align: right; }
              .accordion-header { padding: 11px 16px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
              .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out; background: rgba(5, 6, 9, 0.3); display: flex; flex-direction: column; }
              .sub-link { padding: 11px 18px; color: #a2b1cd; text-decoration: none; font-size: 0.8rem; border-top: 1px solid rgba(255, 255, 255, 0.02); }
              .sub-link:hover { color: #00f2fe; background: rgba(0, 242, 254, 0.02); padding-right: 22px; }
              .accordion-item.active .accordion-content { max-height: 200px; }
              .accordion-item.active .accordion-header { color: #00f2fe; }
              .tg-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 22px; }
              .tg-btn { display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(22, 27, 54, 0.4); border: 1px solid #24A1DE; color: #fff; padding: 10px; border-radius: 12px; text-decoration: none; font-size: 0.8rem; font-weight: bold; transition: all 0.2s; }
              .tg-btn:hover { background: #24A1DE; color: #050609; box-shadow: 0 0 12px rgba(36, 161, 222, 0.35); }
              .tg-btn.channel { border-color: #9d4edd; }
              .tg-btn.channel:hover { background: #9d4edd; color: #fff; box-shadow: 0 0 12px rgba(157, 78, 221, 0.35); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="brand-badge">SibVPN Official Dashboard</div>
              <h1>SibVPN</h1>
              <div class="subtitle">سامانه مدیریت هوشمند اشتراک کاربری</div>
              <div class="status-badge"><div class="status-dot"></div><span>وضعیت اتصال: <strong>${statusText}</strong></span></div>
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
                  <div class="progress-label"><span>میزان مصرف: <span class="progress-usage">${usedGB} GB</span> / ${totalGB} GB</span><span>${percentUsed}%</span></div>
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
              new QRCode(document.getElementById("qrcode"), { text: location.href, width: 130, height: 130 });
              function copyLink() { navigator.clipboard.writeText(location.href); alert("لینک اشتراک SibVPN کپی شد!"); }
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
