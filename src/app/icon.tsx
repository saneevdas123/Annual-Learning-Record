import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 13,
          fontWeight: 800,
          fontFamily: 'Arial, Helvetica, sans-serif',
          letterSpacing: -0.6,
          border: '2px solid #141414',
        }}
      >
        ALR
      </div>
    ),
    { ...size }
  );
}
