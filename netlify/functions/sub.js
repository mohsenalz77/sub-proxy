export default async (req, context) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_BASE_URL}/subdr${cleanPath}${url.search}`;

  const userAgent = req.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': userAgent }
    });

    const rawData = await response.text();
    const subInfo = response.headers.get('subscription-userinfo') || 'upload=0;download=0;total=0;expire=0';

    // استخراج اطلاعات حجم و زمان از هدر سرور
    const infoMap = Object.fromEntries(subInfo.split(';').map(item => item.split('=')));
    const totalGB = infoMap.total ? (parseInt(infoMap.total) / (1024 ** 3)).toFixed(2) : "0";
    const usedGB = ((parseInt(infoMap.upload || 0) + parseInt(infoMap.download || 0)) / (1024 ** 3)).toFixed(2);
    const remGB = (totalGB - usedGB).toFixed(2);
    
    let expireDate = "نامحدود";
    if (infoMap.expire && infoMap.expire !== "0") {
      expireDate = new Date(parseInt(infoMap.expire) * 1000).toLocaleDateString('fa-IR');
    }

    // اگر مرورگر بود، صفحه وب نئونی اختصاصی را رندر کن
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
                  max-width: 450px;
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
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 25px;
              }
              .info-item {
                  background: #16192b;
                  padding: 15px;
                  border-radius: 12px;
                  border: 1px solid #4facfe;
              }
              .info-item span { display: block; color: #8a99ad; font-size: 0.85rem; margin-bottom: 5px; }
              .info-item strong { font-size: 1.1rem; color: #fff; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
              .qr-box {
                  background: white;
                  padding: 15px;
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
              }
              .btn:hover { transform: scale(1.02); box-shadow: 0 0 20px #00f2fe; }
              .apps-section { margin-top: 30px; border-top: 1px solid #252945; padding-top: 20px; }
              .apps-title { color: #00f2fe; font-size: 1rem; margin-bottom: 15px; }
              .app-links { display: flex; justify-content: space-between; gap: 10px; }
              .app-btn {
                  flex: 1;
                  background: #16192b;
                  border: 1px solid #252945;
                  color: #fff;
                  padding: 10px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-size: 0.8rem;
                  transition: 0.2s;
              }
              .app-btn:hover { border-color: #4facfe; background: rgba(79, 172, 254, 0.1); }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>SibVPN</h1>
              <div class="subtitle">وضعیت اشتراک هوشمند شما</div>
              
              <div class="info-grid">
                  <div class="info-item"><span>حجم کل</span><strong>${totalGB} گیگابایت</strong></div>
                  <div class="info-item"><span>مصرف شده</span><strong>${usedGB} گیگابایت</strong></div>
                  <div class="info-item"><span>باقی‌مانده</span><strong>${remGB} گیگابایت</strong></div>
                  <div class="info-item"><span>تاریخ انقضا</span><strong>${expireDate}</strong></div>
              </div>

              <div class="qr-box"><div id="qrcode"></div></div>

              <button class="btn" onclick="copyLink()">کپی لینک اشتراک</button>

              <div class="apps-section">
                  <div class="apps-title">دانلود نرم‌افزارهای مورد نیاز</div>
                  <div class="app-links">
                      <a href="https://github.com/2TakeR1/v2rayNG/releases" target="_blank" class="app-btn">🤖 اندروید</a>
                      <a href="https://apps.apple.com/us/app/streisand/id6450534064" target="_blank" class="app-btn">🍏 آیفون</a>
                      <a href="https://github.com/2TakeR1/v2rayN/releases" target="_blank" class="app-btn">💻 ویندوز</a>
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
                  alert("لینک اشتراک با موفقیت کپی شد!");
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

    // خروجی مخصوص نرم‌افزارها
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
