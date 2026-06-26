
'use server';

/**
 * @fileOverview Server Action to verify Google reCAPTCHA v3 token.
 */

export async function verifyRecaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error('CRITICAL: RECAPTCHA_SECRET_KEY is missing in environment variables.');
    return { success: false, error: 'إعدادات الحماية غير مكتملة في الخادم (Secret Key مفقود).' };
  }

  try {
    // Using URLSearchParams as recommended by Google for application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('secret', secretKey);
    params.append('response', token);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    // Log the response for server-side debugging
    console.log('reCAPTCHA server response:', data);

    if (data.success) {
      // v3 returns a score (0.0 to 1.0). 0.5 is the recommended threshold.
      if (data.score >= 0.5) {
        return { success: true };
      } else {
        console.warn(`reCAPTCHA blocked a suspected bot. Score: ${data.score}`);
        return { success: false, error: 'تم اكتشاف نشاط مشبوه. يرجى المحاولة مرة أخرى أو التأكد من عدم استخدام VPN.' };
      }
    }

    // Handle Google errors
    const errorCodes = data['error-codes'] ? data['error-codes'].join(', ') : 'unknown-error';
    console.error(`reCAPTCHA validation failed. Error codes: ${errorCodes}`);
    
    if (errorCodes.includes('invalid-input-secret')) {
      return { success: false, error: 'مفتاح الحماية (Secret Key) المبرمج في الخادم غير صحيح.' };
    }

    return { success: false, error: 'فشل التحقق من الحماية. يرجى التأكد من عدم وجود إضافات تمنع خدمات Google.' };
  } catch (error) {
    console.error('reCAPTCHA connection error:', error);
    return { success: false, error: 'تعذر الاتصال بخدمة التحقق. يرجى المحاولة لاحقاً.' };
  }
}
