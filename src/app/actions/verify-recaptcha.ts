'use server';

/**
 * @fileOverview Server Action to verify Google reCAPTCHA v3 token.
 */

export async function verifyRecaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error('CRITICAL: RECAPTCHA_SECRET_KEY is missing.');
    return { success: false, error: 'المفتاح السري (Secret Key) غير معرف في إعدادات الخادم.' };
  }

  try {
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

    if (data.success) {
      if (data.score >= 0.5) {
        return { success: true };
      } else {
        return { success: false, error: `تم اكتشاف نشاط مشبوه (Score: ${data.score}). يرجى المحاولة من متصفح آخر.` };
      }
    }

    // الحصول على أكواد الخطأ من Google
    const errorCodes = data['error-codes'] ? data['error-codes'] : [];
    const errorString = errorCodes.join(', ');
    
    console.error('reCAPTCHA Failed:', errorString);

    if (errorCodes.includes('invalid-input-secret')) {
      return { success: false, error: 'المفتاح السري (Secret Key) المبرمج في الخادم غير صحيح.' };
    }
    
    if (errorCodes.includes('invalid-input-response')) {
      return { success: false, error: 'الرمز (Token) غير صالح. تأكد من تطابق مفتاحي الكابتشا (Site & Secret).' };
    }

    return { success: false, error: `فشل التحقق: ${errorString || 'خطأ غير معروف'}. يرجى تحديث الصفحة.` };
  } catch (error) {
    console.error('reCAPTCHA Error:', error);
    return { success: false, error: 'تعذر الاتصال بخدمة التحقق. يرجى التأكد من اتصال الإنترنت.' };
  }
}
