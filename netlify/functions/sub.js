export default async (req, context) => {
  // آدرس اصلی سرور شما بدون اسلش آخر
  const PANEL_SUB_URL = 'https://sub.dr-sib.fun:2096'; 

  const url = new URL(req.url);
  
  // این خط باعث می‌شود هر چیزی بعد از کلمه sub در لینک نتلیفای بیاید، دقیقاً به سرور شما فرستاده شود
  const cleanPath = url.pathname.replace('/.netlify/functions/sub', '');
  const targetUrl = `${PANEL_SUB_URL}${cleanPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('user-agent') || ''
      }
    });

    const data = await response.text();

    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });

    if (response.headers.get('subscription-userinfo')) {
      headers.set('Subscription-Userinfo', response.headers.get('subscription-userinfo'));
    }
    
    return new Response(data, { status: 200, headers });

  } catch (error) {
    return new Response("Error connecting to subscription server", { status: 500 });
  }
};
