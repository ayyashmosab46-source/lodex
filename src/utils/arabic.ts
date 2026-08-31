/**
 * Arabic string normalization for accurate and tolerant game answer comparison
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return text
    // Trim and lowercase
    .trim()
    .toLowerCase()
    // Remove diacritics / Tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta to Haa
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alef Maqsura
    .replace(/ى/g, 'ي')
    // Remove tatweel (kashida)
    .replace(/ـ/g, '')
    // Remove common punctuation and symbols
    .replace(/[.,/#!$%^&*;:{}=\-_`~()؟?،!]/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ');
}

/**
 * Checks if user input matches any target answer (allowing minor typos & definite article 'ال')
 */
export function checkArabicMatch(userInput: string, targets: string[]): boolean {
  const normInput = normalizeArabic(userInput);
  if (!normInput) return false;

  // Also test version without leading 'ال'
  const strippedInput = normInput.startsWith('ال') ? normInput.slice(2) : normInput;

  for (const target of targets) {
    const normTarget = normalizeArabic(target);
    const strippedTarget = normTarget.startsWith('ال') ? normTarget.slice(2) : normTarget;

    if (normInput === normTarget) return true;
    if (strippedInput === strippedTarget) return true;
    if (normInput === strippedTarget) return true;
    if (strippedInput === normTarget) return true;

    // Substring match for compound names if length > 3
    if (normTarget.length >= 4 && normInput.includes(normTarget)) return true;
  }

  return false;
}
