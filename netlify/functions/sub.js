export default async (req, context) => {
  const PANEL_SUB_URL = 'https://sub.dr-sib.fun:2096/subdr'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_SUB_URL}${cleanPath}${url.search}`;

  // تشخیص اینکه آیا کاربر با مرورگر آمده یا با نرم‌افزار v2ray
  const userAgent = req.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': userAgent
      }
    });

    // اگر کاربر با مرورگر آمده بود، مستقیم صفحه وب تمپلیت را با فرمت HTML نشان بده
    if (isBrowser) {
      const htmlData = await response.text();
      return new Response(htmlData, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // اگر نرم‌افزار بود، همان کدهای خام را بفرست
    const data = await response.text();
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'profile-title': 'SibVPN' // 👈 اینجا اسم برندت را بنویس
    });

    if (response.headers.get('subscription-userinfo')) {
      headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    }
    
    return new Response(data, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
