"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import {
  getHeroShaderDpr,
  HERO_SHADER_FRAGMENT,
  HERO_SHADER_VERTEX,
} from "@/lib/hero/hero-shader";

interface HeroShaderBackgroundProps {
  className?: string;
}

/** Readability scrim — sits above the canvas, below page content. */
function HeroShaderScrim({ className }: HeroShaderBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        "bg-gradient-to-b from-neutral-950/10 via-neutral-950/35 to-neutral-950/90",
        className,
      )}
      aria-hidden="true"
    />
  );
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

/**
 * Full-width GLSL hero background.
 * Uses u_time, u_resolution, and u_mouse; pauses when the tab is hidden.
 */
export default function HeroShaderBackground({
  className,
}: HeroShaderBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const visibleRef = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const glContext = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });

    const gl = glContext as WebGLRenderingContext | null;
    if (!gl) {
      return;
    }

    const program = createProgram(gl, HERO_SHADER_VERTEX, HERO_SHADER_FRAGMENT);
    if (!program) {
      return;
    }

    gl.useProgram(program);

    // Full-screen triangle pair (two triangles) — no buffer uploads per frame.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let animationFrame = 0;
    const startTime = performance.now();
    let totalPausedMs = 0;
    let pauseStartedAt: number | null = null;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const dpr = getHeroShaderDpr();
      width = Math.floor(parent.clientWidth * dpr);
      height = Math.floor(parent.clientHeight * dpr);

      if (width < 1 || height < 1) {
        return;
      }

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      gl.viewport(0, 0, width, height);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = getHeroShaderDpr();
      mouseRef.current.targetX = (event.clientX - rect.left) * dpr;
      mouseRef.current.targetY =
        (rect.height - (event.clientY - rect.top)) * dpr;
    };

    const handleVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      visibleRef.current = isVisible;

      if (!isVisible) {
        pauseStartedAt = performance.now();
        cancelAnimationFrame(animationFrame);
        return;
      }

      if (pauseStartedAt !== null) {
        totalPausedMs += performance.now() - pauseStartedAt;
        pauseStartedAt = null;
      }

      animationFrame = requestAnimationFrame(render);
    };

    const render = (now: number) => {
      if (!visibleRef.current) {
        return;
      }

      const elapsed = (now - startTime - totalPausedMs) / 1000;

      // Ease mouse uniform toward target for fluid motion.
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uResolution, width, height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    mouseRef.current.targetX = width * 0.5;
    mouseRef.current.targetY = height * 0.5;
    mouseRef.current.x = width * 0.5;
    mouseRef.current.y = height * 0.5;

    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    // Shell already renders the static gradient; add scrim only.
    return <HeroShaderScrim className={className} />;
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full",
          className,
        )}
        aria-hidden="true"
      />
      <HeroShaderScrim className={className} />
    </>
  );
}
