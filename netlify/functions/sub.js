export default async (req, context) => {
  // ⚠️ آدرس سابسکریپشن پنل خودت رو بدون اسلش آخر، دقیقاً بین دو کوتیشن بذار
  // مثال: 'http://123.45.67.89:2096' یا 'https://sub.yourdomain.com:2096'
  const PANEL_SUB_URL = 'https://sub.dr-sib.fun:2096/subdr'; 

  // گرفتن ادامه آدرس (توکن کاربر) از لینک ورودی
  const url = new URL(req.url);
  const pathAndQuery = url.pathname.replace('/.netlify/functions/sub', '') + url.search;

  try {
    const response = await fetch(`${PANEL_SUB_URL}${pathAndQuery}`, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('user-agent') || ''
      }
    });

    const data = await response.text();

    // ساخت یک پاسخ جدید با هدرهای پنل شما (حجم و تاریخ انقضا)
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });

    if (response.headers.get('subscription-userinfo')) {
      headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    }
    if (response.headers.get('profile-update-interval')) {
      headers.set('profile-update-interval', response.headers.get('profile-update-interval'));
    }

    return new Response(data, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
