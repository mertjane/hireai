"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

type AnimationType =
  | "none"
  | "circle-spread"
  | "round-morph"
  | "swipe-left"
  | "swipe-up"
  | "diag-down-right"
  | "fade-in-out"
  | "shrink-grow"
  | "flip-x-in"
  | "split-vertical"
  | "swipe-right"
  | "swipe-down"
  | "wave-ripple";

interface ToggleThemeProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  animationType?: AnimationType;
}

export const ToggleTheme = ({
  className,
  duration = 400,
  animationType = "fade-in-out",
  ...props
}: ToggleThemeProps) => {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const applyTheme = () => {
      flushSync(() => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      });
    };

    if (animationType === "none" || !document.startViewTransition) {
      applyTheme();
      return;
    }

    await document.startViewTransition(applyTheme).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const newOpts = (dur = duration): KeyframeAnimationOptions => ({
      duration: dur,
      easing: "ease-in-out",
      pseudoElement: "::view-transition-new(root)",
    });

    const oldOpts = (dur = duration): KeyframeAnimationOptions => ({
      duration: dur,
      easing: "ease-in-out",
      pseudoElement: "::view-transition-old(root)",
    });

    switch (animationType) {
      case "circle-spread":
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          newOpts(),
        );
        break;

      case "round-morph":
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0% at ${x}px ${y}px)`,
              `circle(150% at ${x}px ${y}px)`,
            ],
          },
          { ...newOpts(), easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        );
        break;

      case "swipe-left":
        document.documentElement.animate(
          { transform: ["translateX(100%)", "translateX(0%)"] },
          newOpts(),
        );
        document.documentElement.animate(
          { transform: ["translateX(0%)", "translateX(-100%)"] },
          oldOpts(),
        );
        break;

      case "swipe-right":
        document.documentElement.animate(
          { transform: ["translateX(-100%)", "translateX(0%)"] },
          newOpts(),
        );
        document.documentElement.animate(
          { transform: ["translateX(0%)", "translateX(100%)"] },
          oldOpts(),
        );
        break;

      case "swipe-up":
        document.documentElement.animate(
          { transform: ["translateY(100%)", "translateY(0%)"] },
          newOpts(),
        );
        document.documentElement.animate(
          { transform: ["translateY(0%)", "translateY(-100%)"] },
          oldOpts(),
        );
        break;

      case "swipe-down":
        document.documentElement.animate(
          { transform: ["translateY(-100%)", "translateY(0%)"] },
          newOpts(),
        );
        document.documentElement.animate(
          { transform: ["translateY(0%)", "translateY(100%)"] },
          oldOpts(),
        );
        break;

      case "diag-down-right":
        document.documentElement.animate(
          {
            clipPath: [
              "polygon(0 0, 0 0, 0 0)",
              `polygon(0 0, ${viewportWidth * 2}px 0, 0 ${viewportHeight * 2}px)`,
            ],
          },
          newOpts(),
        );
        break;

      case "fade-in-out":
        document.documentElement.animate(
          { opacity: [0, 1] },
          newOpts(duration * 0.5),
        );
        document.documentElement.animate(
          { opacity: [1, 0] },
          oldOpts(duration * 0.5),
        );
        break;

      case "shrink-grow":
        document.documentElement.animate(
          { transform: ["scale(0.85)", "scale(1)"], opacity: [0, 1] },
          { ...newOpts(), easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
        );
        document.documentElement.animate(
          { transform: ["scale(1)", "scale(1.15)"], opacity: [1, 0] },
          oldOpts(duration * 0.5),
        );
        break;

      case "flip-x-in":
        document.documentElement.animate(
          {
            transform: [
              "perspective(1000px) rotateX(-90deg)",
              "perspective(1000px) rotateX(0deg)",
            ],
            opacity: [0, 1],
          },
          { ...newOpts(), easing: "ease-out" },
        );
        document.documentElement.animate(
          {
            transform: [
              "perspective(1000px) rotateX(0deg)",
              "perspective(1000px) rotateX(90deg)",
            ],
            opacity: [1, 0],
          },
          oldOpts(duration * 0.5),
        );
        break;

      case "split-vertical":
        document.documentElement.animate(
          {
            clipPath: ["inset(50% 0 50% 0)", "inset(0% 0 0% 0)"],
          },
          newOpts(),
        );
        break;

      case "wave-ripple":
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius * 0.4}px at ${x}px ${y}px)`,
              `circle(${maxRadius * 0.7}px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            ...newOpts(duration * 1.5),
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          },
        );
        break;

      default:
        break;
    }
  }, [isDark, duration, animationType]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-full transition-colors text-muted-foreground duration-300",
          isDark ? "hover:text-amber-400" : "hover:text-violet-500",
          className,
        )}
        {...props}
      >
        {isDark ? (
          <Sun className="h-5 w-5" strokeWidth="1.5" />
        ) : (
          <Moon className="h-5 w-5" strokeWidth="1.5" />
        )}
      </button>

      {animationType !== "flip-x-in" && animationType !== "none" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              ::view-transition-old(root),
              ::view-transition-new(root) {
                animation: none;
                mix-blend-mode: normal;
              }
            `,
          }}
        />
      )}
    </>
  );
};
