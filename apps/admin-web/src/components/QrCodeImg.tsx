// QR 코드 SVG 렌더 컴포넌트 - qrcode 라이브러리로 데이터 URL 생성
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImgProps {
  text: string;
  size?: number;
  className?: string;
}

export function QrCodeImg({ text, size = 256, className }: QrCodeImgProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [text, size]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: '#F4F5F7' }}
      />
    );
  }
  return <img src={dataUrl} alt={`QR: ${text}`} width={size} height={size} className={className} />;
}
