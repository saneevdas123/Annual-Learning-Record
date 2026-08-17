import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FF4B3E',
          color: '#FDF8F0',
          fontSize: 64,
          fontWeight: 800,
          fontFamily: 'Arial, Helvetica, sans-serif',
          letterSpacing: -2,
          border: '10px solid #141414',
        }}
      >
        ALR
      </div>
    ),
    { ...size }
  );
}
