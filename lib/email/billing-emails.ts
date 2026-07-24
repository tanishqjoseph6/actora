import "server-only";

import { sendProductionEmail } from "@/lib/email/send";
import {
  buildBillingPaymentEmail,
  buildCreditPurchaseEmail,
} from "@/lib/email/templates/billing";

export async function sendBillingPaymentConfirmationEmail(input: {
  to: string;
  planName: string;
  billingInterval: string;
  amountLabel: string;
}) {
  const template = buildBillingPaymentEmail(input);
  return sendProductionEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
    category: "billing_payment",
    tags: [{ name: "category", value: "billing_payment" }],
  });
}

export async function sendCreditPurchaseConfirmationEmail(input: {
  to: string;
  packName: string;
  credits: number;
  amountLabel: string;
}) {
  const template = buildCreditPurchaseEmail(input);
  return sendProductionEmail({
    to: input.to,
    subject: template.subject,
    html: template.html,
    category: "billing_credit_purchase",
    tags: [{ name: "category", value: "credit_purchase" }],
  });
}
