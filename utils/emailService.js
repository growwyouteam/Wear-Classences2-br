const { Resend } = require('resend');

const sendOrderConfirmationEmail = async (order) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing in environment variables.');
      return null;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build items HTML list
    const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right;">₹${item.price}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right;">₹${item.price * item.quantity}</td>
            </tr>
        `).join('');

    const mailOptions = {
      from: `Wear Classences <${process.env.EMAIL_USER || 'onboarding@resend.dev'}>`,
      to: order.email,
      subject: `✅ Order Confirmed! Order #${order._id}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; max-width:600px; width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#B8860B; padding: 30px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:2px;">WEAR CLASSENCES</h1>
              <p style="color:#ffe9a0; margin:8px 0 0 0; font-size:14px;">Premium Fashion Store</p>
            </td>
          </tr>

          <!-- Success Icon & Title -->
          <tr>
            <td style="padding: 30px; text-align:center; border-bottom: 1px solid #eee;">
              <div style="width:70px; height:70px; background:#B8860B; border-radius:50%; display:inline-block; line-height:70px; font-size:36px; color:white; margin-bottom:15px;">✓</div>
              <h2 style="color:#333; margin:0 0 8px 0; font-size:22px;">Order Confirmed!</h2>
              <p style="color:#666; margin:0; font-size:15px;">आपका order successfully place हो गया है।</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 25px 30px 10px 30px;">
              <p style="color:#333; font-size:15px; margin:0;">Dear <strong>${order.customerName}</strong>,</p>
              <p style="color:#555; font-size:14px; margin:12px 0 0 0;">
                Thank you for shopping with Wear Classences! We have received your order 
                and it is now being processed. You will receive another update once your order is shipped.
              </p>
            </td>
          </tr>

          <!-- Order Details Box -->
          <tr>
            <td style="padding: 15px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5eb; border-radius:6px; padding:15px;">
                <tr>
                  <td style="padding:8px 15px;">
                    <p style="margin:0; color:#666; font-size:13px;">Order ID</p>
                    <p style="margin:4px 0 0 0; color:#333; font-weight:bold; font-size:14px;">#${order._id}</p>
                  </td>
                  <td style="padding:8px 15px;">
                    <p style="margin:0; color:#666; font-size:13px;">Payment Method</p>
                    <p style="margin:4px 0 0 0; color:#333; font-weight:bold; font-size:14px;">${order.paymentMethod || 'COD'}</p>
                  </td>
                  <td style="padding:8px 15px;">
                    <p style="margin:0; color:#666; font-size:13px;">Order Status</p>
                    <p style="margin:4px 0 0 0; color:#B8860B; font-weight:bold; font-size:14px;">${order.status || 'Pending'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 10px 30px 15px 30px;">
              <h3 style="color:#333; font-size:16px; margin:0 0 12px 0; border-bottom:2px solid #B8860B; padding-bottom:8px;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background:#f0e8d0;">
                    <th style="padding:10px 8px; text-align:left; font-size:13px; color:#555;">Product</th>
                    <th style="padding:10px 8px; text-align:center; font-size:13px; color:#555;">Qty</th>
                    <th style="padding:10px 8px; text-align:right; font-size:13px; color:#555;">Price</th>
                    <th style="padding:10px 8px; text-align:right; font-size:13px; color:#555;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:12px 8px; text-align:right; font-weight:bold; font-size:15px; color:#333; border-top:2px solid #B8860B;">Total Amount:</td>
                    <td style="padding:12px 8px; text-align:right; font-weight:bold; font-size:16px; color:#B8860B; border-top:2px solid #B8860B;">₹${order.totalAmount}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 10px 30px 25px 30px;">
              <h3 style="color:#333; font-size:15px; margin:0 0 8px 0;">📦 Shipping Address</h3>
              <p style="color:#555; font-size:14px; margin:0; line-height:1.6; background:#f9f5eb; padding:12px 15px; border-radius:6px;">
                ${order.address}
              </p>
              <p style="color:#555; font-size:14px; margin:8px 0 0 0;">📞 ${order.phone}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#333; padding: 20px 30px; text-align:center;">
              <p style="color:#ccc; font-size:13px; margin:0 0 5px 0;">किसी भी सहायता के लिए हमसे संपर्क करें</p>
              <p style="color:#B8860B; font-size:13px; margin:0;">${process.env.EMAIL_USER || 'support@wearclassenses.com'}</p>
              <p style="color:#777; font-size:12px; margin:12px 0 0 0;">© 2026 Wear Classences. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    const data = await resend.emails.send(mailOptions);

    if (data.error) {
      console.error('❌ Resend API Error:', data.error);
      return null;
    }

    console.log('✅ Order confirmation email sent to:', order.email, '| Resend ID:', data.data.id);
    return data;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error.message);
    // Email fail होने पर order fail नहीं होगा
    return null;
  }
};

module.exports = { sendOrderConfirmationEmail };
