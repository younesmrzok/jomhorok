/**
 * @fileOverview Finance Service for Jomhorak.com
 * Handles financial operations. Administrative operations run on the client 
 * to preserve Admin Auth context for Security Rules. 
 * SMM API calls are handled via a separate server action for security.
 */

import { 
  doc, 
  getDoc, 
  collection, 
  runTransaction, 
  increment, 
  updateDoc, 
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { db } from "./config";
import { smmOrder } from "@/lib/smm-provider";

/**
 * Get current exchange rate from DB (Client Side)
 */
async function getInternalExchangeRate() {
  const rateDoc = await getDoc(doc(db, "settings", "exchangeRate"));
  return rateDoc.exists() ? parseFloat(rateDoc.data().rate) || 10 : 10;
}

/**
 * Places an order. 
 * Securely calls the SMM provider (Server Action) while updating Firestore from the client.
 */
export async function placeOrder(uid: string, orderData: { 
  serviceId: string, 
  apiId: number, 
  title: string, 
  platform: string, 
  link: string, 
  quantity: number, 
  price: number 
}) {
  try {
    const userRef = doc(db, "users", uid);
    
    // 1. Start Firestore Transaction (Atomicity)
    return await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error("المستخدم غير موجود");
      
      const userData = userSnap.data();
      if (userData.balance < orderData.price) {
        throw new Error("رصيدك غير كافٍ لإتمام هذا الطلب");
      }

      // 2. Call SMM Provider (This is a Server Action, so API Key is hidden)
      const providerResponse = await smmOrder({
        service: orderData.apiId,
        link: orderData.link,
        quantity: orderData.quantity
      });

      if (providerResponse.error) {
        throw new Error(providerResponse.error);
      }

      if (!providerResponse.order) {
        throw new Error("فشل الحصول على رقم الطلب من المزود");
      }

      // 3. Deduct balance and record order
      transaction.update(userRef, {
        balance: increment(-orderData.price)
      });

      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        userId: uid,
        userName: userData.name || userData.email,
        serviceId: orderData.serviceId,
        apiOrderId: providerResponse.order,
        title: orderData.title,
        platform: orderData.platform,
        link: orderData.link,
        quantity: orderData.quantity,
        price: orderData.price,
        status: 'قيد المراجعة',
        createdAt: new Date().toISOString()
      });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Order Placement Error:", error);
    throw new Error(error.message || "حدث خطأ غير متوقع");
  }
}

/**
 * Admin action to approve shipping and add balance.
 * Runs on client to satisfy Firestore Security Rules (isAdmin check).
 */
export async function approveShippingRequest(shippingId: string, userId: string, amountMad: number) {
  if (!shippingId || !userId || !amountMad) throw new Error("بيانات غير مكتملة");
  
  const rate = await getInternalExchangeRate();
  const amountUsd = parseFloat(amountMad.toString()) / rate;
  
  await updateDoc(doc(db, "shippings", shippingId), { status: 'completed' });
  await updateDoc(doc(db, "users", userId), { balance: increment(amountUsd) });
  
  return { success: true };
}

/**
 * Admin action to reject shipping
 */
export async function rejectShippingRequest(shippingId: string) {
  if (!shippingId) throw new Error("بيانات غير مكتملة");
  await updateDoc(doc(db, "shippings", shippingId), { status: 'rejected' });
  return { success: true };
}

/**
 * Admin action to update user balance directly
 */
export async function adminUpdateUserBalance(userId: string, newBalance: number) {
  return updateDoc(doc(db, "users", userId), { balance: newBalance });
}

/**
 * Admin action to update exchange rate
 */
export async function updateExchangeRate(rate: number) {
  return setDoc(doc(db, "settings", "exchangeRate"), { 
    rate: rate, 
    updatedAt: new Date().toISOString() 
  }, { merge: true });
}

/**
 * Admin action to delete user account
 */
export async function adminDeleteUser(uid: string) {
  return deleteDoc(doc(db, "users", uid));
}

/**
 * Admin action to delete any document
 */
export async function adminDeleteDocument(coll: string, id: string) {
  return deleteDoc(doc(db, coll, id));
}
