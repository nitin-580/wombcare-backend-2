import { Router } from 'express';
import crypto from 'crypto';
import { resend } from '../lib/resend';
import { logger } from '../utils/logger';

const router = Router();

// Endpoint: Create Razorpay Order
router.post('/order', async (req: any, res: any) => {
  try {
    const { amount, name, email, mobile, planName, currency } = req.body;
    if (!amount || !email) {
      return res.status(400).json({ success: false, message: 'Amount and email are required.' });
    }

    const baseAmount = Number(amount);
    const isUSD = currency === 'USD';
    
    let usdToInrRate = 84; // Fallback rate
    if (isUSD) {
      try {
        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        if (rateResponse.ok) {
          const rateData = await rateResponse.json();
          if (rateData.result === 'success' && rateData.rates && rateData.rates.INR) {
            usdToInrRate = Number(rateData.rates.INR);
            logger.info(`Fetched real-time exchange rate for USD to INR: ${usdToInrRate}`);
          }
        }
      } catch (rateErr) {
        logger.error('Error fetching exchange rate, using fallback rate of 84:', rateErr);
      }
    }
    
    const baseAmountInINR = isUSD ? baseAmount * usdToInrRate : baseAmount;
    const gst = baseAmountInINR * 0.18;
    const totalAmount = Math.round((baseAmountInINR + gst) * 100); // Amount in paise

    const razorpayKey = process.env.RAZORPAY_TEST_API_KEY;
    const razorpaySecret = process.env.RAZORPAY_TEST_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      logger.error('Razorpay credentials missing in environment.');
      return res.status(500).json({ success: false, message: 'Payment gateway configuration error.' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64');
    
    // Call Razorpay API using node fetch - always use INR for the gateway
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      })
    });

    const data: any = await response.json();
    if (!response.ok) {
      logger.error('Razorpay Order Creation Failed:', data);
      return res.status(400).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      order: data,
      razorpayKey,
      baseAmount: baseAmountInINR,
      gstAmount: Number(gst.toFixed(2)),
      totalAmount: Number((baseAmountInINR + gst).toFixed(2)),
      currency: 'INR'
    });
  } catch (error: any) {
    logger.error('Error in create order endpoint:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
});

// Endpoint: Verify Razorpay Signature and Send Email
router.post('/verify', async (req: any, res: any) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      email,
      name,
      mobile,
      planName,
      amount,
      currency,
      usdAmount
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !email) {
      return res.status(400).json({ success: false, message: 'All verification parameters are required.' });
    }

    const razorpaySecret = process.env.RAZORPAY_TEST_KEY_SECRET;
    if (!razorpaySecret) {
      logger.error('Razorpay credentials missing in environment.');
      return res.status(500).json({ success: false, message: 'Payment gateway configuration error.' });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      logger.warn(`Signature mismatch. Generated: ${generated_signature}, Provided: ${razorpay_signature}`);
      return res.status(400).json({ success: false, message: 'Invalid signature. Payment verification failed.' });
    }

    logger.info(`Payment verified successfully: ${razorpay_payment_id} for ${email}`);

    // Send thank you / welcome email using Resend
    try {
      const emailResult = await resend.emails.send({
        from: 'WombCare <support@wombcare.in>',
        to: email,
        subject: `Payment Confirmed - Welcome to ${planName || 'WombCare'}!`,
        html: `
          <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a; border-radius: 16px; border: 1px solid #f0f0f0;">
            <div style="margin-bottom: 32px;">
              <h1 style="color: #6d28d9; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">WombCare</h1>
            </div>
            
            <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #111827;">Thank You for Your Payment, ${name}! ✨</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
              Your payment has been successfully verified, and your subscription to <strong>${planName || 'WombCare Wellness Plan'}</strong> is now active.
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>Order ID:</strong> ${razorpay_order_id}</p>
              <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Total Amount Paid (incl. 18% GST):</strong> ${
                currency === 'USD' && usdAmount
                  ? `$${Number(usdAmount).toFixed(2)} USD (Paid as ₹${Number(amount).toFixed(2)})`
                  : `₹${Number(amount).toFixed(2)}`
              }</p>
            </div>

            <div style="background: #a855f7; padding: 20px; border-radius: 12px; color: #ffffff; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: 600;">Your login details will be sent to you shortly.</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
              Our systems are generating your dashboard credentials. You will receive a separate email shortly with your login link and password.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;">
            
            <p style="font-size: 14px; color: #9ca3af; margin: 0;">
              Best regards,<br>
              <strong>The WombCare Team</strong>
            </p>
          </div>
        `,
      });
      logger.info(`Confirmation email sent: ${emailResult.data?.id}`);
    } catch (emailErr) {
      logger.error('Error sending confirmation email:', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and confirmation email sent.',
      loginDetailsMessage: 'Login details will be sent to you shortly.'
    });
  } catch (error: any) {
    logger.error('Error in verify payment endpoint:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
});

export default router;
