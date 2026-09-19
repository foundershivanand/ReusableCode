import type { NotificationTemplate } from "../schemas/index.js";

export interface RenderedMessage {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateSafeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Invalid URL protocol");
    }
    return parsed.toString();
  } catch {
    throw new Error(`Unsafe or malformed URL: ${url}`);
  }
}

export class TemplateEngine {
  render(template: NotificationTemplate, data: Record<string, any>, locale = "en"): RenderedMessage {
    switch (template) {
      case "welcome_email": {
        const name = escapeHtml(data.name || "there");
        const appName = escapeHtml(data.appName || "Our Platform");
        return {
          subject: locale === "es" ? `¡Bienvenido a ${appName}!` : `Welcome to ${appName}!`,
          html: `<p>Hello <strong>${name}</strong>,</p><p>Welcome to ${appName}! We're thrilled to have you on board.</p>`,
          text: `Hello ${data.name || "there"},\n\nWelcome to ${data.appName || "Our Platform"}! We're thrilled to have you on board.`
        };
      }
      case "verification_email": {
        const verifyUrl = validateSafeUrl(data.verificationUrl);
        return {
          subject: locale === "es" ? "Verifique su correo electrónico" : "Verify your email address",
          html: `<p>Please confirm your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
          text: `Please confirm your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`
        };
      }
      case "password_reset": {
        const resetUrl = validateSafeUrl(data.resetUrl);
        return {
          subject: locale === "es" ? "Restablecer su contraseña" : "Reset your password",
          html: `<p>You requested a password reset. Click below to choose a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 1 hour.</p>`,
          text: `You requested a password reset. Visit:\n${resetUrl}\n\nThis link expires in 1 hour.`
        };
      }
      case "magic_link": {
        const loginUrl = validateSafeUrl(data.loginUrl);
        return {
          subject: locale === "es" ? "Su enlace de inicio de sesión" : "Your magic sign-in link",
          html: `<p>Click below to securely sign in:</p><p><a href="${loginUrl}">Sign In</a></p><p>This link expires in 15 minutes and can only be used once.</p>`,
          text: `Click below to securely sign in:\n${loginUrl}\n\nThis link expires in 15 minutes and can only be used once.`
        };
      }
      case "invoice_receipt": {
        const invoiceNumber = escapeHtml(data.invoiceNumber || "INV-000");
        const amount = escapeHtml(data.amount || "$0.00");
        const downloadUrl = data.downloadUrl ? validateSafeUrl(data.downloadUrl) : undefined;
        return {
          subject: `Invoice Receipt: ${invoiceNumber}`,
          html: `<p>Thank you for your payment of <strong>${amount}</strong> for invoice <strong>${invoiceNumber}</strong>.</p>${
            downloadUrl ? `<p><a href="${downloadUrl}">Download PDF Invoice</a></p>` : ""
          }`,
          text: `Thank you for your payment of ${data.amount || "$0.00"} for invoice ${data.invoiceNumber || "INV-000"}.${
            downloadUrl ? `\nDownload PDF: ${downloadUrl}` : ""
          }`
        };
      }
      case "payment_failed": {
        const retryUrl = data.retryUrl ? validateSafeUrl(data.retryUrl) : undefined;
        return {
          subject: "Urgent: Payment failed for your subscription",
          html: `<p>We were unable to process your latest subscription payment.</p><p>Please update your payment method to prevent service interruption.</p>${
            retryUrl ? `<p><a href="${retryUrl}">Update Payment Method</a></p>` : ""
          }`,
          text: `We were unable to process your latest subscription payment. Please update your payment method.${
            retryUrl ? `\nUpdate: ${retryUrl}` : ""
          }`
        };
      }
      case "subscription_updated": {
        const tier = escapeHtml(data.tier || "Standard");
        return {
          subject: `Subscription Updated to ${tier}`,
          html: `<p>Your subscription plan has been successfully updated to <strong>${tier}</strong>.</p>`,
          text: `Your subscription plan has been successfully updated to ${data.tier || "Standard"}.`
        };
      }
      case "system_alert": {
        const message = escapeHtml(data.message || "System maintenance or alert.");
        return {
          subject: "Important System Notification",
          html: `<p>${message}</p>`,
          text: data.message || "System maintenance or alert."
        };
      }
      default:
        throw new Error(`Unknown template: ${template}`);
    }
  }
}
