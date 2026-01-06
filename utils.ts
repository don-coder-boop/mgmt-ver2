
/**
 * Compresses an image to a maximum width of 800px and returns a Base64 string.
 */
export const compressImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Calculates current localStorage usage in MB.
 */
export const getStorageUsage = () => {
  let total = 0;
  for (const x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += (localStorage[x].length + x.length) * 2;
    }
  }
  return (total / (1024 * 1024)).toFixed(2);
};

export const MAX_STORAGE_MB = 5;

/**
 * Generates a unique ID
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Download CSV helper with specific headers for nuuanu seeding tool
 */
export const downloadCSV = (filename: string, data: any[]) => {
  if (data.length === 0) return;
  
  // Specific headers requested: 
  // instagram ID, 이름, 전화번호, 받는분기타연락처, 받는분우편번호, 주소, 제품명, 사이즈, 수량, 배송메세지1
  const customHeaders = [
    "instagram ID", "이름", "전화번호", "받는분기타연락처", 
    "받는분우편번호", "주소", "제품명", "사이즈", "수량", "배송메세지1"
  ];

  const csvRows = [customHeaders.join(',')];

  data.forEach(item => {
    // Escape quotes and handle potential commas in fields
    const escape = (val: any) => {
      const s = String(val || "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const row = [
      escape(item.instagramId),
      escape(item.name),
      escape(item.phone),
      escape(""), // 받는분기타연락처 (공란)
      escape(""), // 받는분우편번호 (공란)
      escape(item.address),
      escape(item.productName),
      escape(item.size),
      escape(item.quantity || 1),
      escape(item.message) // 배송메세지1
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
