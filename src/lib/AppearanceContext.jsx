import { createContext, useContext, useState, useEffect } from "react";

const AppearanceContext = createContext();

const DEFAULT_SETTINGS = {
  theme: "dark",
  density: "comfortable",
  reduceMotion: false,
  glassIntensity: 16,
  fontSize: 14,
};

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      return {
        theme: localStorage.getItem("biomine_theme") || DEFAULT_SETTINGS.theme,
        density: localStorage.getItem("biomine_density") || DEFAULT_SETTINGS.density,
        reduceMotion: localStorage.getItem("biomine_reduce_motion") === "true",
        glassIntensity: parseInt(localStorage.getItem("biomine_glass_intensity") || "16"),
        fontSize: parseInt(localStorage.getItem("biomine_font_size") || "14"),
      };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Persist individually for quick recall & simpler hooks
      Object.entries(newSettings).forEach(([key, value]) => {
        if (key === "reduceMotion") localStorage.setItem("biomine_reduce_motion", value);
        else if (key === "glassIntensity") localStorage.setItem("biomine_glass_intensity", value);
        else if (key === "fontSize") localStorage.setItem("biomine_font_size", value);
        else if (key === "theme") localStorage.setItem("biomine_theme", value);
        else if (key === "density") localStorage.setItem("biomine_density", value);
      });
      
      return updated;
    });
  };

  // Centralized DOM Engine Injector
  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Theme Activation
    if (settings.theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }

    // 2. Informational Density Mapping
    root.classList.remove("compact-density", "comfortable-density");
    root.classList.add(`${settings.density}-density`);

    // 3. Physics / Animation Suppression
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // 4. Dynamic Glass Variables Vector Computing
    // High intensity scaling -> opacity and reflection automatically react together for realism.
    const intensityRatio = settings.glassIntensity / 40; // range 0 to 1
    const baseOpacity = 0.15 + (intensityRatio * 0.4); // from 0.15 flat to 0.55 deep
    const baseBlur = settings.glassIntensity;
    const baseBorder = 0.02 + (intensityRatio * 0.08);
    
    root.style.setProperty('--glass-blur', `${baseBlur}px`);
    root.style.setProperty('--glass-opacity', baseOpacity.toString());
    root.style.setProperty('--glass-border-opacity', baseBorder.toString());
    root.style.setProperty('--glass-reflection', (0.01 + intensityRatio * 0.1).toString());
    root.style.setProperty('--glass-shadow', (0.1 + intensityRatio * 0.4).toString());

    // 5. Global Typographical Matrix
    root.style.fontSize = `${settings.fontSize}px`;

  }, [settings]);

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => useContext(AppearanceContext);
