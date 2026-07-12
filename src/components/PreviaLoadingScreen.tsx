import React from "react";

export function PreviaLoadingScreen() {
  return (
    <div className="previa-loading">
      <style>{`
        .previa-loading {
          width: 100%;
          height: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          gap: 24px;
        }

        .previa-loading__mark-wrap {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Rotating dashed ring */
        .previa-loading__ring {
          position: absolute;
          inset: 0;
          animation: previa-spin 2.2s linear infinite;
        }

        /* Shield pulses gently while it "loads" */
        .previa-loading__shield {
          width: 150px;
          height: auto;
          object-fit: contain;
          margin-left: -12px;
          animation: previa-pulse 1.6s ease-in-out infinite;
        }

        .previa-loading__text {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #0f1a12;
        }

        .previa-loading__caption {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          letter-spacing: 3px;
          color: #737373;
          margin-top: -12px;
        }

        @keyframes previa-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes previa-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
      `}</style>

      <div className="previa-loading__mark-wrap">
        <svg
          className="previa-loading__ring"
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle
            cx="100"
            cy="100"
            r="94"
            stroke="#2A8F4F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="18 14"
          />
        </svg>

        <img
          src="/logo-previa-shield.png"
          alt="Previa"
          className="previa-loading__shield"
        />
      </div>

      <div className="previa-loading__text">Cargando...</div>
      <div className="previa-loading__caption">PREVIA</div>
    </div>
  );
}
