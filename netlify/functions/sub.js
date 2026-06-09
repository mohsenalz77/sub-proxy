export default async (req, context) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 

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
      const pairs = subInfo.split(';');
      pairs.forEach(pair => {
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
    
    let expireDate = "نامحدود";
    if (expireTimestamp > 0) {
      expireDate = new Date(expireTimestamp * 1000).toLocaleDateString('fa-IR');
    }

    const isUserActive = response.status === 200 && (totalBytes === 0 || remBytes > 0);
    const statusText = isUserActive ? "اشتراک فعال" : "غیرفعال / پایان یافته";
    const statusColor = isUserActive ? "#00ffcc" : "#ff007f";
    
    // تاریخ دقیق آخرین بررسی و فعالیت سابسکریپشن روی سرور
    const lastActivity = new Date().toLocaleDateString('fa-IR') + ' ساعت ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isBrowser) {
      const currentUrl = req.url;
      const htmlPage = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>پنل اشتراک SibVPN</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
              body { 
                  background: radial-gradient(circle at center, #1a1c2e 0%, #0a0b10 100%);
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
                  background: rgba(15, 18, 36, 0.75); 
                  border: 2px solid #00f2fe; 
                  box-shadow: 0 0 25px rgba(0, 242, 254, 0.25), inset 0 0 15px rgba(0, 242, 254, 0.1); 
                  border-radius: 24px; 
                  padding: 35px; 
                  max-width: 480px; 
                  width: 100%; 
                  text-align: center; 
                  backdrop-filter: blur(12px); 
              }
              h1 { 
                  color: #00f2fe; 
                  text-shadow: 0 0 12px #00f2fe, 0 0 30px #4facfe; 
                  font-size: 2.5rem; 
                  margin: 0 0 5px 0;
                  letter-spacing: 1px;
              }
              .subtitle { color: #707e94; font-size: 0.95rem; margin-bottom: 30px; }
              
              /* وضعیت نئونی چشمک‌زن */
              .status-badge { 
                  display: inline-flex; 
                  align-items: center; 
                  gap: 10px; 
                  background: rgba(22, 25, 43, 0.6); 
                  padding: 8px 20px; 
                  border-radius: 30px; 
                  border: 1px solid ${statusColor}; 
                  font-size: 0.9rem; 
                  margin-bottom: 25px; 
                  box-shadow: 0 0 15px rgba(${isUserActive ? '0,255,204' : '255,0,127'}, 0.15); 
              }
              .status-dot { 
                  width: 10px; 
                  height: 10px; 
                  background-color: ${statusColor}; 
                  border-radius: 50%; 
                  box-shadow: 0 0 10px ${statusColor}, 0 0 20px ${statusColor}; 
                  animation: pulse 2s infinite;
              }
              @keyframes pulse {
                  0% { transform: scale(0.9); opacity: 0.6; }
                  50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 15px ${statusColor}, 0 0 25px ${statusColor}; }
                  100% { transform: scale(0.9); opacity: 0.6; }
              }

              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 25px; }
              .info-item { 
                  background: rgba(22, 25, 43, 0.8); 
                  padding: 14px; 
                  border-radius: 16px; 
                  border: 1px solid #222643; 
                  text-align: right; 
                  transition: transform 0.2s, border-color 0.2s;
              }
              .info-item:hover { border-color: #4facfe; transform: translateY(-2px); }
              .full-width { grid-column: span 2; }
              .info-item span { display: block; color: #707e94; font-size: 0.8rem; margin-bottom: 5px; }
              .info-item strong { font-size: 1.05rem; color: #fff; }
              .info-item.highlight { border-color: rgba(0, 242, 254, 0.5); background: rgba(0, 242, 254, 0.03); }
              .info-item.highlight strong { color: #00f2fe; text-shadow: 0 0 8px rgba(0,242,254,0.4); }
              
              /* نوار ترافیک نئونی ارتقا یافته */
              .progress-container { background: rgba(22, 25, 43, 0.8); border-radius: 16px; padding: 18px; margin-bottom: 30px; border: 1px solid #222643; text-align: right; }
              .progress-label { display: flex; justify-content: space-between; font-size: 0.9rem; color: #707e94; margin-bottom: 10px; }
              .progress-usage { color: #00f2fe; font-weight: bold; text-shadow: 0 0 5px rgba(0,242,254,0.3); }
              .progress-bar-bg { background: #08090d; border-radius: 10px; height: 16px; width: 100%; overflow: hidden; border: 1px solid #222643; }
              .progress-bar-fill { background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); height: 100%; width: ${percentUsed}%; box-shadow: 0 0 12px #00f2fe; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
              
              .qr-box { background: white; padding: 14px; border-radius: 18px; display: inline-block; margin-bottom: 30px; box-shadow: 0 0 20px rgba(0, 242, 254, 0.2); }
              
              .btn { 
                  background: linear-gradient(45deg, #00f2fe, #4facfe); 
                  color: #0a0b10; 
                  border: none; 
                  padding: 14px 25px; 
                  border-radius: 12px; 
                  font-weight: bold; 
                  cursor: pointer; 
                  width: 100%; 
                  font-size: 1.05rem; 
                  box-shadow: 0 0 15px rgba(0, 242, 254, 0.4); 
                  transition: 0.3s; 
                  margin-bottom: 30px; 
              }
              .btn:hover { transform: scale(1.01); box-shadow: 0 0 25px #00f2fe; }
              
              /* سیستم آکاردئون جذاب */
              .apps-section { border-top: 1px solid #222643; padding-top: 25px; }
              .apps-title { color: #00f2fe; font-size: 1.1rem; margin-bottom: 18px; text-shadow: 0 0 5px rgba(0,242,254,0.2); }
              .accordion-item { margin-bottom: 12px; background: rgba(22, 25, 43, 0.5); border: 1px solid #222643; border-radius: 12px; overflow: hidden; text-align: right; transition: border-color 0.2s; }
              .accordion-item:hover { border-color: #4facfe; }
              .accordion-header { padding: 14px 18px; font-size: 0.95rem; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
              .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; background: rgba(10, 11, 16, 0.5); display: flex; flex-direction: column; }
              .sub-link { padding: 12px 20px; color: #707e94; text-decoration: none; font-size: 0.9rem; border-top: 1px solid #1c1f36; transition: all 0.2s; }
              .sub-link:hover { color: #00f2fe; background: rgba(0, 242, 254, 0.04); padding-right: 25px; }
              .accordion-item.active .accordion-content { max-height: 250px; }
              .accordion-item.active .accordion-header { border-bottom: 1px solid #222643; color: #00f2fe; background: rgba(0, 242, 254, 0.02); }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>SibVPN</h1>
              <div class="subtitle">سیستم مدیریت اشتراک هوشمند</div>
              
              <div class="status-badge">
                  <div class="status-dot"></div>
                  <span>وضعیت اکانت: <strong>${statusText}</strong></span>
              </div>

              <div class="info-grid">
                  <div class="info-item full-width"><span>شناسه کاربری (Token)</span><strong>${subId}</strong></div>
                  <div class="info-item full-width highlight"><span>آخرین سینک و فعالیت سابسکریپشن</span><strong>${lastActivity}</strong></div>
                  <div class="info-item highlight"><span>حجم کل دوره</span><strong>${totalGB} GB</strong></div>
                  <div class="info-item highlight"><span>حجم باقی‌مانده</span><strong>${remGB} GB</strong></div>
                  <div class="info-item"><span>تاریخ اتمام اعتبار</span><strong>${expireDate}</strong></div>
                  <div class="info-item"><span>ترافیک مصرف شده</span><strong>${usedGB} GB</strong></div>
                  <div class="info-item"><span>میزان دانلود</span><strong>${downloadGB} GB</strong></div>
                  <div class="info-item"><span>میزان آپلود</span><strong>${uploadGB} GB</strong></div>
              </div>

              <div class="progress-container">
                  <div class="progress-label">
                      <span>میزان مصرف ترافیک: <span class="progress-usage">${usedGB} GB</span> / ${totalGB} GB</span>
                      <span>${percentUsed}%</span>
                  </div>
                  <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
              </div>

              <div class="qr-box"><div id="qrcode"></div></div>
              <button class="btn" onclick="copyLink()">کپی لینک سابسکریپشن</button>

              <div class="apps-section">
                  <div class="apps-title">📥 دانلود کلاینت‌های مورد نیاز</div>
                  
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🤖 سیستم‌عامل اندروید <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2TakeR1/v2rayNG/releases" target="_blank" class="sub-link">📥 دانلود v2rayNG (لینک مستقیم گیت‌هاب)</a>
                          <a href="https://play.google.com/store/apps/details?v=com.v2ray.ang" target="_blank" class="sub-link">🏪 دانلود v2rayNG از گوگل پلی</a>
                      </div>
                  </div>
                  
                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">🍏 سیستم‌عامل iOS (آیفون / آیپد) <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://apps.apple.com/us/app/streisand/id6450534064" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن Streisand</a>
                          <a href="https://apps.apple.com/us/app/v2box-v2ray-client/id1640566424" target="_blank" class="sub-link">🍏 دانلود اپلیکیشن V2Box</a>
                      </div>
                  </div>

                  <div class="accordion-item">
                      <div class="accordion-header" onclick="toggleAccordion(this)">💻 سیستم‌عامل ویندوز <span>▼</span></div>
                      <div class="accordion-content">
                          <a href="https://github.com/2TakeR1/v2rayN/releases" target="_blank" class="sub-link">📥 دانلود v2rayN (نسخه رسمی کامپیوتر)</a>
                      </div>
                  </div>
              </div>
          </div>
          <script>
              new QRCode(document.getElementById("qrcode"), { text: "${currentUrl}", width: 160, height: 160 });
              function copyLink() { navigator.clipboard.writeText("${currentUrl}"); alert("لینک اشتراک با موفقیت کپی شد!"); }
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
