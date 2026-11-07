// src/utils/clipboard.js
// Bulletproof clipboard copy utility that works reliably across all browsers,
// devices (iOS, Android, Windows, Mac), and security contexts (HTTPS, localhost).

export async function copyToClipboard(text) {
  if (!text) return false;

  // Method 1: Modern Navigator Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback if permission is denied or in an iframe
    }
  }

  // Method 2: Legacy execCommand Fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);
    return false;
  }
}
