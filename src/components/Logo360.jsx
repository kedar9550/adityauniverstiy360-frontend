import React, { useEffect } from "react";

const Logo360 = ({ logoUrl }) => {
  const spokesCount = 20;
  const spokes = Array.from({ length: spokesCount });

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes rotateSpokes {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        {/* Center Content: Image or Text */}
        <div style={styles.centerContent}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" style={styles.logo} />
          ) : (
            <div style={styles.text}>360</div>
          )}
        </div>

        {/* Rotating spokes */}
        <div style={styles.spokesWrapper}>
          {spokes.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.spoke,
                transform: `rotate(${i * (360 / spokesCount)}deg)`,
                opacity: 0.5 + (i / spokesCount) * 0.5,
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  container: {
    position: "relative",
    width: "200px", // Slightly bigger container for bigger text
    height: "200px",
  },

  centerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: "64px", // Increased size as requested
    fontWeight: "bold",
    color: "#fff",
    opacity: 1,
  },

  logo: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
  },

  spokesWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    animation: "rotateSpokes 1s steps(20) infinite",
  },

  spoke: {
    position: "absolute",
    top: "10px",                 // Moved slightly inward
    left: "50%",
    marginLeft: "-4px",
    width: "8px",
    height: "30px",             // Decreased height as requested
    backgroundColor: "#fff",
    borderRadius: "4px",
    transformOrigin: "center 90px", // Pivot remains at container center (100, 100) -> 10 + 90
  },
};

export default Logo360;