"use client";

import React, { useEffect, useRef } from "react";

/**
 * Professional FinTech Floating Particles Component
 * Blue & White theme - Creates a network of data points with connections
 */
export function FloatingParticles() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size
		const resizeCanvas = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Professional Particle class with Blue & White FinTech theme
		class Particle {
			x: number;
			y: number;
			size: number;
			speedX: number;
			speedY: number;
			opacity: number;
			color: string; // Blue & White FinTech palette

			constructor() {
				if (!canvas) {
					this.x = 0;
					this.y = 0;
					this.size = 0;
					this.speedX = 0;
					this.speedY = 0;
					this.opacity = 0;
					this.color = "";
					return;
				}
				this.x = Math.random() * canvas.width;
				this.y = Math.random() * canvas.height;
				this.size = Math.random() * 1.2 + 0.4; // 0.4 - 1.6px (refined, professional)
				this.speedX = (Math.random() - 0.5) * 0.15; // Slower, more subtle
				this.speedY = (Math.random() - 0.5) * 0.15;
				this.opacity = Math.random() * 0.2 + 0.1; // 0.1 - 0.3 opacity
				
				// Blue & White FinTech color palette
				const colors = [
					`rgba(59, 168, 240, ${this.opacity})`,      // Primary blue - trust
					`rgba(96, 165, 250, ${this.opacity * 0.8})`, // Light blue
					`rgba(147, 197, 253, ${this.opacity * 0.6})`, // Sky blue
					`rgba(191, 219, 254, ${this.opacity * 0.4})`, // Very light blue
				];
				this.color = colors[Math.floor(Math.random() * colors.length)];
			}

			update() {
				if (!canvas) return;
				this.x += this.speedX;
				this.y += this.speedY;

				// Wrap around edges
				if (this.x > canvas.width) this.x = 0;
				if (this.x < 0) this.x = canvas.width;
				if (this.y > canvas.height) this.y = 0;
				if (this.y < 0) this.y = canvas.height;
			}

			draw() {
				if (!ctx) return;
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
				ctx.fillStyle = this.color;
				ctx.fill();
			}

			// Calculate distance to another particle
			distanceTo(other: Particle): number {
				const dx = this.x - other.x;
				const dy = this.y - other.y;
				return Math.sqrt(dx * dx + dy * dy);
			}
		}

		// Create particles
		const particles: Particle[] = [];
		if (!canvas) return;
		const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
		
		for (let i = 0; i < particleCount; i++) {
			particles.push(new Particle());
		}

		// Connection distance threshold
		const connectionDistance = 140;

		// Animation loop
		let animationId: number;
		const animate = () => {
			if (!ctx || !canvas) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// Update particles
			particles.forEach((particle) => {
				particle.update();
			});

			// Draw connections (data network effect) - Blue theme
			ctx.lineWidth = 0.4;
			
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const distance = particles[i].distanceTo(particles[j]);
					if (distance < connectionDistance) {
						// Fade out connections based on distance - Blue tones
						const opacity = (1 - distance / connectionDistance) * 0.12;
						ctx.strokeStyle = `rgba(59, 168, 240, ${opacity})`;
						ctx.beginPath();
						ctx.moveTo(particles[i].x, particles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.stroke();
					}
				}
			}

			// Draw particles on top
			particles.forEach((particle) => {
				particle.draw();
			});

			animationId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="floating-particles"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

/**
 * Professional FinTech Chart Lines Component
 * Blue & White theme - Creates subtle financial data visualization lines
 */
export function ChartLines() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Draw subtle chart lines - Blue & White FinTech theme
		const drawChartLines = () => {
			if (!ctx || !canvas) return;

			ctx.lineWidth = 0.8;
			ctx.setLineDash([6, 10]); // Dashed lines

			// Draw 2-3 subtle data trend lines in blue tones
			const blueTones = [
				"rgba(59, 168, 240, 0.05)",   // Primary blue
				"rgba(96, 165, 250, 0.04)",   // Light blue
				"rgba(147, 197, 253, 0.03)",  // Sky blue
			];

			for (let i = 0; i < 3; i++) {
				ctx.strokeStyle = blueTones[i];
				const startY = canvas.height * (0.25 + i * 0.25);
				const amplitude = 25 + Math.random() * 35;
				const frequency = 0.0004 + Math.random() * 0.0008;

				ctx.beginPath();
				ctx.moveTo(0, startY);

				for (let x = 0; x < canvas.width; x += 2) {
					const y = startY - Math.sin(x * frequency) * amplitude - (x * 0.04); // Subtle upward trend
					ctx.lineTo(x, y);
				}

				ctx.stroke();
			}
		};

		drawChartLines();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="chart-lines"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

/**
 * Professional FinTech Animated Gradient Background
 * Blue & White theme - Trustworthy and professional
 */
export function AnimatedGradient() {
	return (
		<div
			className="animated-gradient"
			style={{
				position: "fixed",
				inset: 0,
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

/**
 * Geometric Data Pattern Component
 * Adds subtle geometric shapes suggesting data visualization
 */
export function GeometricPattern() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Simple hash function for stable pattern
		const hash = (x: number, y: number) => {
			return ((x * 73856093) ^ (y * 19349663)) % 1000;
		};

		// Draw subtle geometric patterns - Blue & White
		const drawPatterns = () => {
			if (!ctx || !canvas) return;

			// Draw subtle hexagons or data nodes
			const hexSize = 60;
			const cols = Math.ceil(canvas.width / hexSize) + 1;
			const rows = Math.ceil(canvas.height / hexSize) + 1;

			ctx.strokeStyle = "rgba(59, 168, 240, 0.03)";
			ctx.lineWidth = 0.5;

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = col * hexSize + (row % 2 === 0 ? 0 : hexSize / 2);
					const y = row * hexSize * 0.866; // Hexagon spacing

					// Use hash for stable pattern (only draw ~15% of hexagons)
					if (hash(col, row) < 150) {
						ctx.beginPath();
						for (let i = 0; i < 6; i++) {
							const angle = (Math.PI / 3) * i;
							const hx = x + hexSize * 0.3 * Math.cos(angle);
							const hy = y + hexSize * 0.3 * Math.sin(angle);
							if (i === 0) {
								ctx.moveTo(hx, hy);
							} else {
								ctx.lineTo(hx, hy);
							}
						}
						ctx.closePath();
						ctx.stroke();
					}
				}
			}
		};

		const resizeCanvas = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			drawPatterns();
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="geometric-pattern"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

/**
 * FinTech Dot Grid Pattern Component
 * Creates a professional data visualization-style dot grid
 * Blue & White theme - Perfect for FinTech
 */
export function DotGridPattern() {
	return (
		<div
			className="dot-grid-pattern"
			style={{
				position: "fixed",
				inset: 0,
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

/**
 * FinTech Mesh Gradient Component
 * Modern animated mesh gradient with blue & white tones
 * Creates depth and sophistication
 */
export function MeshGradient() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		// Create mesh gradient points
		const points: Array<{ x: number; y: number; vx: number; vy: number; color: { r: number; g: number; b: number; a: number } }> = [];
		const pointCount = 5;

		// Blue & White color palette
		const colorPalette = [
			{ r: 59, g: 168, b: 240, a: 0.12 },   // Primary blue
			{ r: 96, g: 165, b: 250, a: 0.10 },   // Light blue
			{ r: 147, g: 197, b: 253, a: 0.08 },  // Sky blue
			{ r: 191, g: 219, b: 254, a: 0.06 },  // Very light blue
			{ r: 59, g: 168, b: 240, a: 0.09 },   // Primary blue (lighter)
		];

		for (let i = 0; i < pointCount; i++) {
			points.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 0.2,
				vy: (Math.random() - 0.5) * 0.2,
				color: colorPalette[i % colorPalette.length],
			});
		}

		let animationId: number;
		const animate = () => {
			if (!ctx || !canvas) return;

			// Clear with slight fade for smooth animation
			ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Update points
			points.forEach((point) => {
				point.x += point.vx;
				point.y += point.vy;

				if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
				if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
				point.x = Math.max(0, Math.min(canvas.width, point.x));
				point.y = Math.max(0, Math.min(canvas.height, point.y));
			});

			// Create multiple overlapping gradients for mesh effect
			points.forEach((point) => {
				const radius = Math.max(canvas.width, canvas.height) * 0.5;
				const gradient = ctx.createRadialGradient(
					point.x,
					point.y,
					0,
					point.x,
					point.y,
					radius
				);

				gradient.addColorStop(0, `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, ${point.color.a})`);
				gradient.addColorStop(0.5, `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, ${point.color.a * 0.5})`);
				gradient.addColorStop(1, `rgba(${point.color.r}, ${point.color.g}, ${point.color.b}, 0)`);

				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			});

			animationId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="mesh-gradient"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 0,
			}}
		/>
	);
}

