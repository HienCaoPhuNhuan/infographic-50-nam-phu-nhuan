(() => {
  // Keep names and common Vietnamese compounds together after content edits.
  const phrases = [
    'Hồ Chí Minh', 'Hoàng Minh Giám', 'Nguyễn Hải Đăng', 'Phạm Minh Dũng',
    'Lê Song Khang', 'Phú Nhuận', 'Đức Nhuận', 'TP. HCM', 'Thành phố',
    'Lao động', 'Hạng Nhì', 'Hạng Ba', 'Thủ tướng', 'Chính phủ',
    'Bằng khen', 'Quốc gia', 'Thế giới', 'Học sinh', 'học sinh',
    'giáo viên', 'nhân viên', 'cán bộ', 'giáo dục', 'Giáo dục',
    'Hiệu trưởng', 'Đại học', 'Cao đẳng', 'Thạc sĩ', 'thi đua',
    'Tin học', 'Văn phòng', 'Trí tuệ', 'nhân tạo', 'khoa học',
    'kỹ thuật', 'thể thao', 'nghệ thuật', 'kỹ năng', 'học thuật',
    'năng khiếu', 'Cây Mùa Xuân', 'Áo dài', 'Taekwondo',
  ].sort((a, b) => b.length - a.length);
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${escaped.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
  const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.textContent;
    const matches = [...text.matchAll(pattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of matches) {
      fragment.append(text.slice(offset, match.index));
      const span = document.createElement('span');
      span.className = 'keep-together';
      span.textContent = match[0];
      fragment.append(span);
      offset = match.index + match[0].length;
    }
    fragment.append(text.slice(offset));
    node.replaceWith(fragment);
  }

  const measure = element => {
    const lines = new Map();
    const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (textWalker.nextNode()) {
      const node = textWalker.currentNode;
      for (const word of node.textContent.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const rect = range.getBoundingClientRect();
        const top = Math.round(rect.top);
        const line = lines.get(top) || [];
        line.push(rect);
        lines.set(top, line);
      }
    }
    let maxGap = 0;
    for (const line of lines.values()) {
      for (let i = 1; i < line.length; i++) {
        maxGap = Math.max(maxGap, line[i].left - line[i - 1].right);
      }
    }
    const last = [...lines.values()].at(-1);
    const widow = lines.size > 1 && last.length === 1;
    return maxGap + (widow ? 100 : 0);
  };

  // A small size adjustment can change line breaks without stretching spaces.
  for (const element of document.querySelectorAll('p, .timeline > li > span, .check-list li, .academic-strip article > span')) {
    if (getComputedStyle(element).textAlign !== 'justify') continue;
    const originalSize = parseFloat(getComputedStyle(element).fontSize);
    let bestSize = originalSize;
    let bestScore = measure(element);
    if (bestScore < originalSize * 0.65) continue;
    const candidates = [99, 101, 98, 102, 97, 103, 96, 104, 95, 105, 94, 106, 93, 107, 92, 108];
    for (const percent of candidates) {
      const size = Math.max(10.8, originalSize * percent / 100);
      element.style.fontSize = `${size}px`;
      const score = measure(element);
      if (score < bestScore) {
        bestSize = size;
        bestScore = score;
      }
    }
    element.style.fontSize = `${bestSize}px`;
  }
})();
