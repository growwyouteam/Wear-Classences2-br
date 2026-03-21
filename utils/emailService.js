const { Resend } = require('resend');

// Helper: format address (handles both string and object)
const formatAddress = (address) => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  const { street, city, state, zip, country } = address;
  return [street, city, state, zip, country].filter(Boolean).join(', ');
};

// Helper: format currency
const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const sendOrderConfirmationEmail = async (order) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing in environment variables.');
      return null;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build product rows
    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f0e8d0; font-size: 14px; color: #333;">
            ${item.productName || 'Product'}
            ${item.size ? `<br><span style="font-size:12px;color:#888;">Size: ${item.size}</span>` : ''}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f0e8d0; text-align: center; font-size: 14px; color: #555;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f0e8d0; text-align: right; font-size: 14px; color: #555;">
            ${formatCurrency(item.price)}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f0e8d0; text-align: right; font-size: 14px; color: #333; font-weight: 600;">
            ${formatCurrency(item.price * item.quantity)}
          </td>
        </tr>`
      )
      .join('');

    // Coupon row (only if discount was applied)
    const couponHtml =
      order.discountAmount > 0
        ? `<tr>
            <td colspan="3" style="padding: 10px 10px; text-align: right; font-size: 14px; color: #228B22; font-weight: 600;">
              🎟 Coupon Discount${order.couponCode ? ` (${order.couponCode})` : ''}:
            </td>
            <td style="padding: 10px 10px; text-align: right; font-size: 14px; color: #228B22; font-weight: 700;">
              - ${formatCurrency(order.discountAmount)}
            </td>
          </tr>`
        : '';

    // Order date
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    // Estimated delivery (5-7 business days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const estimatedDelivery = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formattedAddress = formatAddress(order.address);

    const mailOptions = {
      from: `Wear Classences <support@wearclassense.com>`,
      to: order.email,
      subject: `✅ Order Confirmed — #${String(order._id).slice(-8).toUpperCase()} | Wear Classences`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed – Wear Classences</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f0e8; font-family: 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- ===== TOP GOLD HEADER ===== -->
          <tr>
            <td style="background: linear-gradient(135deg, #B8860B 0%, #DAA520 50%, #B8860B 100%); padding: 36px 30px; text-align: center;">
              <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:800; letter-spacing:3px; text-transform:uppercase;">WEAR CLASSENCES</h1>
              <p style="color:#fff8dc; margin:6px 0 0 0; font-size:13px; letter-spacing:1px;">Premium Fashion — Est. 2024</p>
            </td>
          </tr>

          <!-- ===== SUCCESS BANNER ===== -->
          <tr>
            <td style="background:#fefcf4; padding: 32px 30px 24px 30px; text-align: center; border-bottom: 1px solid #f0e8d0;">
              <div style="display:inline-block; width:72px; height:72px; background: linear-gradient(135deg, #228B22, #32CD32); border-radius:50%; text-align:center; line-height:72px; font-size:38px; color:white; margin-bottom:18px;">✓</div>
              <h2 style="color:#1a1a1a; margin:0 0 8px 0; font-size:24px; font-weight:700;">Your Order is Confirmed!</h2>
              <p style="color:#666; margin:0; font-size:15px; line-height:1.5;">
                Thank you for shopping with us, <strong style="color:#B8860B;">${order.customerName}</strong>!<br/>
                We've received your order and it's being prepared for dispatch.
              </p>
            </td>
          </tr>

          <!-- ===== ORDER META (3 columns) ===== -->
          <tr>
            <td style="padding: 20px 30px 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px; overflow:hidden; border: 1px solid #f0e8d0;">
                <tr style="background:#fdf8ee;">
                  <td style="padding: 14px 16px; border-right: 1px solid #f0e8d0;">
                    <p style="margin:0; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Order ID</p>
                    <p style="margin:5px 0 0 0; color:#333; font-weight:700; font-size:14px;">#${String(order._id).slice(-8).toUpperCase()}</p>
                  </td>
                  <td style="padding: 14px 16px; border-right: 1px solid #f0e8d0;">
                    <p style="margin:0; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Order Date</p>
                    <p style="margin:5px 0 0 0; color:#333; font-weight:700; font-size:14px;">${orderDate}</p>
                  </td>
                  <td style="padding: 14px 16px; border-right: 1px solid #f0e8d0;">
                    <p style="margin:0; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Payment</p>
                    <p style="margin:5px 0 0 0; color:#333; font-weight:700; font-size:14px;">${order.paymentMethod || 'COD'}</p>
                  </td>
                  <td style="padding: 14px 16px;">
                    <p style="margin:0; color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Status</p>
                    <p style="margin:5px 0 0 0; color:#228B22; font-weight:700; font-size:14px;">✅ ${order.status || 'Confirmed'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== ESTIMATED DELIVERY ===== -->
          <tr>
            <td style="padding: 16px 30px 0 30px;">
              <div style="background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 1px solid #c8e6c9; border-radius:8px; padding: 12px 18px; display:flex; align-items:center;">
                <p style="margin:0; color:#2e7d32; font-size:14px; font-weight:600;">
                  🚚 &nbsp;Estimated Delivery: <strong>${estimatedDelivery}</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- ===== ORDER ITEMS TABLE ===== -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <h3 style="color:#1a1a1a; font-size:16px; font-weight:700; margin:0 0 14px 0; padding-bottom:10px; border-bottom: 2px solid #B8860B;">
                🛍 Order Summary
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#fdf8ee;">
                    <th style="padding:10px 10px; text-align:left; font-size:12px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f0e8d0;">Product</th>
                    <th style="padding:10px 10px; text-align:center; font-size:12px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f0e8d0;">Qty</th>
                    <th style="padding:10px 10px; text-align:right; font-size:12px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f0e8d0;">Unit Price</th>
                    <th style="padding:10px 10px; text-align:right; font-size:12px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f0e8d0;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  ${couponHtml}
                  <tr>
                    <td colspan="3" style="padding:14px 10px; text-align:right; font-size:15px; color:#1a1a1a; font-weight:700; border-top: 2px solid #B8860B;">
                      Grand Total:
                    </td>
                    <td style="padding:14px 10px; text-align:right; font-size:18px; color:#B8860B; font-weight:800; border-top: 2px solid #B8860B;">
                      ${formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- ===== SHIPPING ADDRESS ===== -->
          <tr>
            <td style="padding: 20px 30px 28px 30px;">
              <h3 style="color:#1a1a1a; font-size:16px; font-weight:700; margin:0 0 12px 0; padding-bottom:10px; border-bottom: 2px solid #B8860B;">
                📦 Shipping Details
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8ee; border-radius:8px; border:1px solid #f0e8d0; overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px 0; font-size:15px; color:#333; font-weight:700;">${order.customerName}</p>
                    <p style="margin:0 0 4px 0; font-size:14px; color:#555;">📞 ${order.phone}</p>
                    <p style="margin:0; font-size:14px; color:#555; line-height:1.6;">📍 ${formattedAddress}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== CONTACT / HELP ===== -->
          <tr>
            <td style="background:#fdf8ee; padding: 18px 30px; text-align:center; border-top: 1px solid #f0e8d0; border-bottom: 1px solid #f0e8d0;">
              <p style="margin:0; font-size:14px; color:#555;">
                Have questions about your order? We're here to help!
              </p>
              <p style="margin:6px 0 0 0; font-size:14px;">
                <a href="mailto:${process.env.EMAIL_USER || 'support@wearclassense.com'}" style="color:#B8860B; text-decoration:none; font-weight:600;">
                  ${process.env.EMAIL_USER || 'support@wearclassense.com'}
                </a>
              </p>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:#1a1a1a; padding: 22px 30px; text-align:center;">
              <p style="color:#B8860B; font-size:16px; font-weight:700; margin:0 0 4px 0; letter-spacing:2px;">WEAR CLASSENCES</p>
              <p style="color:#888; font-size:12px; margin:0 0 10px 0;">Premium Fashion — Style Redefined</p>
              <p style="color:#555; font-size:11px; margin:0;">© ${new Date().getFullYear()} Wear Classences. All rights reserved.</p>
              <p style="color:#444; font-size:11px; margin:6px 0 0 0;">This is an automated email. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
    };

    const data = await resend.emails.send(mailOptions);

    if (data.error) {
      console.error('❌ Resend API Error:', JSON.stringify(data.error));
      return null;
    }

    console.log(
      `✅ Order confirmation email sent to: ${order.email} | Resend ID: ${data.data?.id}`
    );
    return data;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error.message);
    return null;
  }
};

module.exports = { sendOrderConfirmationEmail };
