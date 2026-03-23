export interface OrderConfirmItem {
  prdNm: string;
  ordrQty: number;
  unitPrc: number;
  subtotAmt: number;
  prdImgUrl: string;
}

export interface OrderConfirmData {
  orderNumber: string;
  items: OrderConfirmItem[];
  totalAmount: number;
  shippingAddress?: string;
  recipientName?: string;
}

export function orderConfirmTemplate(params: {
  name: string;
  order: OrderConfirmData;
}): string {
  const itemRows = params.order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="60" style="padding-right:12px;">
                  <img src="${item.prdImgUrl}" alt="${item.prdNm}" width="60" height="60" style="border-radius:4px;object-fit:cover;" />
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 4px;color:#18181b;font-size:14px;font-weight:600;">${item.prdNm}</p>
                  <p style="margin:0;color:#71717a;font-size:13px;">Qty: ${item.ordrQty} x ${item.unitPrc.toLocaleString()} USD</p>
                </td>
                <td style="vertical-align:top;text-align:right;white-space:nowrap;">
                  <p style="margin:0;color:#18181b;font-size:14px;font-weight:600;">${item.subtotAmt.toLocaleString()} USD</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join('');

  const shippingSection =
    params.order.shippingAddress || params.order.recipientName
      ? `
        <tr>
          <td style="padding:20px 0 0;">
            <h3 style="margin:0 0 8px;color:#18181b;font-size:16px;">Shipping Info</h3>
            ${params.order.recipientName ? `<p style="margin:0 0 4px;color:#52525b;font-size:14px;">${params.order.recipientName}</p>` : ''}
            ${params.order.shippingAddress ? `<p style="margin:0;color:#52525b;font-size:14px;">${params.order.shippingAddress}</p>` : ''}
          </td>
        </tr>`
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#6366f1;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Vibe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:22px;">Order Confirmed!</h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:16px;line-height:1.6;">
                Hi ${params.name}, your order <strong>${params.order.orderNumber}</strong> has been placed successfully.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                ${itemRows}
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
                <tr>
                  <td style="padding:16px 0;border-top:2px solid #18181b;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#18181b;font-size:16px;font-weight:700;">Total</td>
                        <td style="text-align:right;color:#18181b;font-size:16px;font-weight:700;">
                          ${params.order.totalAmount.toLocaleString()} USD
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${shippingSection}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                &copy; Vibe. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
