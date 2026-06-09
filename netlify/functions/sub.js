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

    // اگر کاربر با مرورگر آمده بود، کد را رمزگشایی می‌کنیم تا تمپلیت وب باز شود
    if (isBrowser) {
      try {
        // تبدیل کد Base64 به متن معمولی (اگر پنل رمزگذاری کرده باشد)
        const decodedData = Buffer.from(rawData, 'base64').toString('utf-8');
        
        // اگر متن رمزگشایی شده حاوی کدهای HTML تمپلیت بود، آن را نشان بده
        if (decodedData.includes('<!DOCTYPE html>') || decodedData.includes('<html')) {
          return new Response(decodedData, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      } catch (e) {
        // اگر خطایی در رمزگشایی بود، همان متن اصلی را بفرست
      }

      // اگر خود متن اصلی از اول HTML بود
      if (rawData.includes('<!DOCTYPE html>') || rawData.includes('<html')) {
        return new Response(rawData, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    // خروجی استاندارد برای نرم‌افزارها
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
