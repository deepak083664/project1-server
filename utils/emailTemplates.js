/**
 * Generates an HTML email template for an order confirmation.
 * 
 * @param {Object} user - The user who placed the order.
 * @param {Object} order - The populated document containing the order.
 * @returns {string} The HTML email template.
 */
const orderConfirmationTemplate = (user, order) => {
    const storeName = "Project1 Store";
    const primaryColor = "#4F46E5"; // Indigo-600

    // Generate rows for the itemized products
    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
          ${item.name} ${item.size ? `<br><small style="color:#6b7280;">Size: ${item.size}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: ${primaryColor}; padding: 30px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
          .content { padding: 30px; }
          .greeting { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #111827; }
          .thanks-msg { color: #4b5563; margin-bottom: 25px; }
          .order-details { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; }
          .order-details strong { color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #d1d5db; color: #111827; font-weight: 600; }
          .totals { width: 100%; max-width: 300px; margin-left: auto; font-size: 14px; }
          .totals td { padding: 8px 12px; }
          .totals .label { text-align: left; color: #4b5563; }
          .totals .value { text-align: right; font-weight: 500; color: #111827; }
          .totals .grand-total { border-top: 2px solid #e5e7eb; font-weight: 700; font-size: 16px; color: ${primaryColor}; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>${storeName}</h1>
          </div>
  
          <!-- Content -->
          <div class="content">
            <div class="greeting">Hi ${user.name},</div>
            <div class="thanks-msg">Thank you for your purchase! Your order is confirmed and is currently <strong>${order.orderStatus}</strong>.</div>
  
            <!-- Order Meta -->
            <div class="order-details">
               <div><strong>Order ID:</strong> ${order._id}</div>
               <div><strong>Payment ID:</strong> ${order.paymentId || 'N/A'}</div>
               <div style="margin-top: 8px;"><strong>Shipping Address:</strong><br>
                  ${order.shippingAddress.fullName}<br>
                  ${order.shippingAddress.address}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}
               </div>
            </div>
  
            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
  
            <!-- Totals -->
            <table class="totals">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="value">₹${order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Tax (18%):</td>
                <td class="value">₹${order.taxPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">Shipping:</td>
                <td class="value">₹${order.shippingPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label grand-total">Grand Total:</td>
                <td class="value grand-total">₹${order.totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
  
          <!-- Footer -->
          <div class="footer">
            &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
};

module.exports = {
    orderConfirmationTemplate
};

