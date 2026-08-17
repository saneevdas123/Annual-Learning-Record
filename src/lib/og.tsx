import { ImageResponse } from 'next/og';
import { SITE } from './site';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = 'image/png';

export function ogResponse({
  eyebrow = SITE.orgShort,
  title,
  subtitle = SITE.description,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FDF8F0',
          color: '#141414',
          padding: 56,
          fontFamily: 'Georgia, Times New Roman, serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FF4B3E',
                color: '#FDF8F0',
                border: '4px solid #141414',
                fontSize: 22,
                fontWeight: 800,
                fontFamily: 'Arial, Helvetica, sans-serif',
                letterSpacing: -1,
              }}
            >
              ALR
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: 18,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  letterSpacing: 0.4,
                }}
              >
                {SITE.appName}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(20,20,20,0.55)',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  marginTop: 4,
                }}
              >
                {eyebrow}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              padding: '10px 16px',
              background: '#FDE8D8',
              border: '3px solid #141414',
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'Arial, Helvetica, sans-serif',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Learning ledger
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            marginTop: 28,
            paddingTop: 28,
            borderTop: '3px solid #141414',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: 26,
              lineHeight: 1.35,
              color: 'rgba(20,20,20,0.62)',
              fontFamily: 'Arial, Helvetica, sans-serif',
              maxWidth: 920,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '3px solid #141414',
            paddingTop: 22,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', color: '#FF4B3E' }}>Record · Evaluate · Credit</div>
          <div style={{ display: 'flex', color: 'rgba(20,20,20,0.5)' }}>cutm.ac.in</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
