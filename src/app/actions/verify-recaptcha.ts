
'use server';

/**
 * @fileOverview Server Action to verify Google reCAPTCHA v3 token.
 */

export async function verifyRecaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is missing in environment variables.');
    return { success: false, error: 'حدث خطأ في إعدادات الحماية.' };
  }

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
      method: 'POST',
    });

    const data = await response.json();

    // v3 returns a score (0.0 to 1.0). Usually 0.5 is the threshold.
    if (data.success && data.score >= 0.5) {
      return { success: true };
    }

    return { success: false, error: 'فشل التحقق من الحماية (reCAPTCHA). يرجى المحاولة مرة أخرى.' };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'فشل الاتصال بخدمة التحقق من الحماية.' };
  }
}
