import { useEffect, useState } from "react";

export function OrientationOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function checkOrientation() {
      // Only show on mobile
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        setShow(false);
        return;
      }
      // Portrait = window.innerHeight > window.innerWidth
      setShow(window.innerWidth > window.innerHeight);
    }
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    checkOrientation();
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.95)",
        color: "#fff",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2.5rem",
        textAlign: "center",
      }}
    >
      Please rotate your phone to play
    </div>
  );
}
