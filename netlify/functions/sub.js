export default async (req, context) => {
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_BASE_URL}/subdr${cleanPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': req.headers.get('user-agent') || '' }
    });

    const rawData = await response.text();
    
    // استخراج تمام هدرهای پنل برای بررسی
    let allHeaders = {};
    response.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });

    // دکود کردن متن برای دیدن کانفیگ‌ها
    let decodedText = "";
    try {
      decodedText = Buffer.from(rawData, 'base64').toString('utf-8');
    } catch (e) {
      decodedText = "خطا در دکود بیس۶۴ - متن احتمالاً بیس۶۴ نیست";
    }

    // ساخت یک صفحه ساده برای نمایش اطلاعات خام
    const debugHtml = `
    <!DOCTYPE html>
    <html lang="fa" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <title>صفحه عیب‌یابی SibVPN</title>
        <style>
            body { background: #111; color: #eee; font-family: monospace; padding: 20px; }
            h2 { color: #00f2fe; border-bottom: 1px solid #333; padding-bottom: 10px; }
            pre { background: #222; padding: 15px; border-radius: 8px; overflow-x: auto; border: 1px solid #444; }
        </style>
    </head>
    <body>
        <h2>1. HTTP Status Code from Panel:</h2>
        <pre>${response.status} ${response.statusText}</pre>

        <h2>2. All Response Headers from Panel:</h2>
        <pre>${JSON.stringify(allHeaders, null, 2)}</pre>

        <h2>3. Raw Data (Base64) from Panel:</h2>
        <pre>${rawData || "[خالی است]"}</pre>

        <h2>4. Decoded Data (Plain Text):</h2>
        <pre>${decodedText || "[خالی است]"}</pre>
    </body>
    </html>
    `;

    return new Response(debugHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (error) {
    return new Response("Error: " + error.message, { status: 500 });
  }
};
