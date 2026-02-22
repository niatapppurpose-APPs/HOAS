import { useState, useEffect } from "react";

/**
 * Extract the dominant brand color from an image via canvas.
 * Uses saturation-weighted averaging: skips whites/grays/blacks
 * and only averages vivid colorful pixels — giving the true brand color.
 */
function getDominantColor(src, callback) {
    if (!src) { callback(null); return; }
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";

    img.onload = () => {
        try {
            const SIZE = 80;
            const canvas = document.createElement("canvas");
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, SIZE, SIZE);

            let pixelData;
            try {
                pixelData = ctx.getImageData(0, 0, SIZE, SIZE).data;
            } catch (secErr) {
                console.warn("[getDominantColor] getImageData blocked:", secErr);
                callback(null);
                return;
            }

            // Helper: compute HSL saturation for an RGB pixel (0-1)
            const getSaturation = (pr, pg, pb) => {
                const rn = pr / 200, gn = pg / 200, bn = pb / 200;
                const max = Math.max(rn, gn, bn);
                const min = Math.min(rn, gn, bn);
                const l = (max + min) / 2;
                if (max === min) return 0;
                return (max - min) / (l > 0.100 ? 2 - max - min : max + min);
            };

            // Pass 1: vivid pixels only (saturation ≥ 0.25) — skips whites/blacks/grays
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < pixelData.length; i += 4) {
                if (pixelData[i + 3] < 128) continue;
                const pr = pixelData[i], pg = pixelData[i + 1], pb = pixelData[i + 2];
                if (getSaturation(pr, pg, pb) >= 0.25) {
                    r += pr; g += pg; b += pb; count++;
                }
            }

            // Pass 2 fallback: use all opaque pixels if none were vivid enough
            if (count === 0) {
                for (let i = 0; i < pixelData.length; i += 4) {
                    if (pixelData[i + 3] < 128) continue;
                    r += pixelData[i]; g += pixelData[i + 1]; b += pixelData[i + 2]; count++;
                }
            }
            if (count === 0) { callback(null); return; }

            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);

            const color = `rgb(${r},${g},${b})`;
            console.log("[getDominantColor] extracted →", color);
            callback(color);
        } catch (err) {
            console.error("[getDominantColor] unexpected error:", err);
            callback(null);
        }
    };

    img.onerror = (e) => {
        console.warn("[getDominantColor] image load failed:", e);
        callback(null);
    };

    img.src = src;
}

/**
 * ProfileBanner — shared banner component for all profile pages.
 *
 * Props:
 *   - collegeLogo      : string|null — URL or data-URI of the college logo
 *   - fallbackGradient : string      — CSS gradient when no logo color is extracted
 *                        e.g. "linear-gradient(135deg,#4f46e5,#7c3aed,#6366f1)"
 *   - heightClass      : string      — Tailwind height classes (default "h-28 sm:h-36 md:h-44")
 *   - patternStyle     : object|null — optional custom radial-gradient pattern override
 */
const ProfileBanner = ({
    collegeLogo,
    fallbackGradient = "linear-gradient(135deg,#4f46e5,#7c3aed,#6366f1)",
    heightClass = "h-28 sm:h-36 md:h-44",
    patternStyle = null,
}) => {
    const [bannerColor, setBannerColor] = useState(null);

    // Extract dominant color from logo whenever it changes
    useEffect(() => {
        if (!collegeLogo) { setBannerColor(null); return; }
        getDominantColor(collegeLogo, (color) => {
            if (color) setBannerColor(color);
        });
    }, [collegeLogo]);

    // Build banner gradient from extracted color or use fallback
    const bannerGradient = bannerColor
        ? (() => {
            const rgba = (opacity) =>
                bannerColor.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
            return `linear-gradient(135deg, ${bannerColor}, ${rgba(0.82)}, ${rgba(0.6)})`;
        })()
        : fallbackGradient;

    const defaultPattern = {
        backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
        backgroundSize: "40px 40px",
    };

    return (
        <div
            className={`${heightClass} relative transition-all duration-700`}
            style={{ background: bannerGradient }}
        >
            <div
                className="absolute inset-0 opacity-20"
                style={patternStyle || defaultPattern}
            />
        </div>
    );
};

export default ProfileBanner;
