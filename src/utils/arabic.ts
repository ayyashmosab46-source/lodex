export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alef variants
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize taa marbouta and haa
    .replace(/ة/g, 'ه')
    // Normalize yaa and alef maqsoura
    .replace(/ى/g, 'ي')
    // Normalize spaces and punctuation
    .replace(/[ـ\-_,.!؟]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isArabicMatch(input: string, target: string, aliases: string[] = []): boolean {
  const normInput = normalizeArabic(input);
  const normTarget = normalizeArabic(target);

  if (!normInput || !normTarget) return false;

  if (normInput === normTarget) return true;
  if (normInput.includes(normTarget) || normTarget.includes(normInput)) {
    if (normInput.length >= 3 && normTarget.length >= 3) return true;
  }

  for (const alias of aliases) {
    const normAlias = normalizeArabic(alias);
    if (normInput === normAlias) return true;
    if (normInput.includes(normAlias) || normAlias.includes(normInput)) {
      if (normInput.length >= 3 && normAlias.length >= 3) return true;
    }
  }

  return false;
}
