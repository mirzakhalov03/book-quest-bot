export const formatAndValidateFullName = (input) => {
    const trimmed = input.trim();
  
    // Length check
    if (trimmed.length > 30) return { error: 'Ism va familiya 30 ta belgidan uzun bo‘lishi mumkin emas.' };
  
    // Split into words
    const words = trimmed.split(/\s+/);
    if (words.length < 2 || words.length > 3) {
      return { error: 'Iltimos, to‘liq ism va familiyangizni va kiriting.\nMasalan: *Javohir Mirzakhalov*' };
    }
  
    // Only allow letters (Latin & Cyrillic) and some safe symbols
    const invalidChars = /[0-9]/;
    for (let w of words) {
      if (invalidChars.test(w)) {
        return { error: 'Xato!\nIsmingiz raqam yoki noto‘g‘ri belgilarni o‘z ichiga olmasligi kerak.' };
      }
    }
  
    // Capitalize first letter of each word
    const formatted = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  
    return { formatted, error: null };
  };
  