import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Generate HTML template for the bill
const generateBillHTML = (billNumber, customerName, items, totalAmount, discount, finalAmount, paymentMethod) => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const itemsHTML = items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">₹${parseFloat(item.price).toFixed(2)}</td>
      <td style="text-align:right">₹${parseFloat(item.subtotal).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }

          .header { text-align: center; margin-bottom: 20px; }
          .shop-name { font-size: 26px; font-weight: bold; color: #2563EB; }
          .shop-tagline { font-size: 13px; color: #666; margin-top: 4px; }

          .divider { border-top: 2px dashed #ccc; margin: 14px 0; }

          .bill-info { display: flex; justify-content: space-between; margin-bottom: 14px; }
          .bill-info p { font-size: 13px; color: #444; }
          .bill-info span { font-weight: bold; color: #111; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          thead { background-color: #2563EB; color: white; }
          thead th { padding: 10px 8px; text-align: left; font-size: 13px; }
          thead th:nth-child(2) { text-align: center; }
          thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
          tbody tr:nth-child(even) { background-color: #F3F4F6; }
          tbody td { padding: 9px 8px; font-size: 13px; border-bottom: 1px solid #E5E7EB; }

          .totals { margin-left: auto; width: 60%; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
          .totals-row.final { border-top: 2px solid #2563EB; margin-top: 6px; padding-top: 10px; }
          .totals-row.final span { font-size: 16px; font-weight: bold; color: #2563EB; }

          .payment-badge {
            display: inline-block;
            background: #DBEAFE;
            color: #2563EB;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            margin-top: 10px;
          }

          .footer { text-align: center; margin-top: 24px; }
          .footer p { font-size: 13px; color: #666; }
          .thank-you { font-size: 16px; font-weight: bold; color: #2563EB; margin-top: 6px; }
        </style>
      </head>
      <body>

        <!-- Shop Header -->
        <div class="header">
          <div class="shop-name">🏪 Tanu Soaps and General</div>
          <div class="shop-tagline">Quality Products at Best Prices</div>
        </div>

        <div class="divider"></div>

        <!-- Bill Info -->
        <div class="bill-info">
          <div>
            <p>Bill No: <span>${billNumber}</span></p>
            <p>Customer: <span>${customerName}</span></p>
          </div>
          <div style="text-align:right">
            <p>Date: <span>${date}</span></p>
            <p>Payment: <span>${paymentMethod}</span></p>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${parseFloat(totalAmount).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Discount</span>
            <span>− ₹${parseFloat(discount).toFixed(2)}</span>
          </div>
          <div class="totals-row final">
            <span>Total</span>
            <span>₹${parseFloat(finalAmount).toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Method -->
        <div>
          <span class="payment-badge">💳 Paid via ${paymentMethod}</span>
        </div>

        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p class="thank-you">Visit Again 🙏</p>
        </div>

      </body>
    </html>
  `;
};

// Generate and share PDF
export const generateAndSharePDF = async (billNumber, customerName, items, totalAmount, discount, finalAmount, paymentMethod) => {
  try {
    const html = generateBillHTML(
      billNumber,
      customerName,
      items,
      totalAmount,
      discount,
      finalAmount,
      paymentMethod
    );

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({ html });

    // Share PDF
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Bill ${billNumber}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      alert('Sharing is not available on this device');
    }
  } catch (error) {
    console.log('PDF Error:', error);
    alert('Failed to generate PDF');
  }
};