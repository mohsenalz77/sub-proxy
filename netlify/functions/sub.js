export default async (req, context) => {
  // آدرس پایه سرور شما بدون بخش سابدر
  const PANEL_BASE_URL = 'https://sub.dr-sib.fun:2096'; 

  const url = new URL(req.url);
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  
  // خودکار کلمه /subdr/ را در پشت صحنه به آدرس سرور اضافه می‌کنیم
  const targetUrl = `${PANEL_BASE_URL}/subdr${cleanPath}${url.search}`;

  const userAgent = req.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': userAgent
      }
    });

    if (isBrowser) {
      const htmlData = await response.text();
      return new Response(htmlData, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const data = await response.text();
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'profile-title': 'SibVPN'
    });

    if (response.headers.get('subscription-userinfo')) {
      headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    }
    
    return new Response(data, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
