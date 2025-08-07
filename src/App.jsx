import React, { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";

function App() {
	const [permissionGranted, setPermissionGranted] = useState(false);
	const [heartRate, setHeartRate] = useState(60);
	const [isShaking, setIsShaking] = useState(false);
	const [beat, setBeat] = useState(false);
	const lastShakeTime = useRef(0);
	const shakeTimeout = useRef(null);
	const beatInterval = useRef(null);
	// Move the useRef hook here, at the top level of the component
	const mouseShakeCountRef = useRef(0);

	const requestMotionPermission = async () => {
		if (
			typeof DeviceMotionEvent !== "undefined" &&
			typeof DeviceMotionEvent.requestPermission === "function"
		) {
			try {
				const permission = await DeviceMotionEvent.requestPermission();
				if (permission === "granted") {
					setPermissionGranted(true);
				} else {
					console.log("Motion permission denied");
				}
			} catch (error) {
				console.error("Error requesting motion permission:", error);
			}
		} else {
			setPermissionGranted(true);
		}
	};

	useEffect(() => {
		if (!permissionGranted) {
			return;
		}

		let lastX = 0,
			lastY = 0,
			lastZ = 0;
		const shakeThreshold = 15;

		const handleMotion = (event) => {
			const { x, y, z } = event.accelerationIncludingGravity || {};
			if (x === null || y === null || z === null) return;

			const now = Date.now();
			const deltaX = Math.abs(x - lastX);
			const deltaY = Math.abs(y - lastY);
			const deltaZ = Math.abs(z - lastZ);

			if (
				(deltaX > shakeThreshold ||
					deltaY > shakeThreshold ||
					deltaZ > shakeThreshold) &&
				now - lastShakeTime.current > 100 // Debounce
			) {
				setIsShaking(true);
				setHeartRate((prev) => Math.min(prev + 10, 180));
				lastShakeTime.current = now;

				if (shakeTimeout.current) {
					clearTimeout(shakeTimeout.current);
				}

				shakeTimeout.current = setTimeout(() => {
					setIsShaking(false);
				}, 2000);
			}

			lastX = x;
			lastY = y;
			lastZ = z;
		};

		// Mouse move simulation for desktop
		let lastMouseX = 0,
			lastMouseY = 0;
		const mouseShakeThreshold = 50;
		const mouseShakeDebounce = 200;

		const handleMouseMove = (event) => {
			const now = Date.now();
			const deltaX = Math.abs(event.clientX - lastMouseX);
			const deltaY = Math.abs(event.clientY - lastMouseY);

			if (
				(deltaX > mouseShakeThreshold ||
					deltaY > mouseShakeThreshold) &&
				now - lastShakeTime.current > mouseShakeDebounce
			) {
				mouseShakeCountRef.current++;
				if (mouseShakeCountRef.current > 1) {
					setIsShaking(true);
					setHeartRate((prev) => Math.min(prev + 8, 180));
					lastShakeTime.current = now;
					mouseShakeCountRef.current = 0;

					if (shakeTimeout.current) {
						clearTimeout(shakeTimeout.current);
					}
					shakeTimeout.current = setTimeout(() => {
						setIsShaking(false);
					}, 2000);
				}
			}
			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
		};

		window.addEventListener("devicemotion", handleMotion);
		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("devicemotion", handleMotion);
			window.removeEventListener("mousemove", handleMouseMove);
			if (shakeTimeout.current) {
				clearTimeout(shakeTimeout.current);
			}
		};
	}, [permissionGranted]);

	// Heart rate decay when not shaking
	useEffect(() => {
		if (!isShaking && heartRate > 60) {
			const decayInterval = setInterval(() => {
				setHeartRate((prev) => Math.max(prev - 1, 60));
			}, 500);

			return () => clearInterval(decayInterval);
		}
	}, [isShaking, heartRate]);

	// Heartbeat animation
	useEffect(() => {
		const interval = 60000 / heartRate;

		const animate = () => {
			setBeat(true);
			setTimeout(() => setBeat(false), 150);
		};

		animate();
		beatInterval.current = setInterval(animate, interval);

		return () => {
			if (beatInterval.current) {
				clearInterval(beatInterval.current);
			}
		};
	}, [heartRate]);

	// ... (rest of your component's styling and rendering logic is mostly fine)

	const getHeartColor = () => {
		if (isShaking) return "text-red-500";
		if (heartRate > 100) return "text-orange-500";
		if (heartRate > 80) return "text-yellow-500";
		return "text-pink-500";
	};

	const getStatusText = () => {
		if (isShaking) return "Shaking Detected!";
		if (heartRate > 100) return "Elevated Heart Rate";
		if (heartRate > 60) return "Heart Rate Decreasing";
		return "Resting Heart Rate";
	};

	const getBackgroundClass = () => {
		if (isShaking) return "bg-gradient-to-br from-red-900 to-red-700";
		if (heartRate > 100)
			return "bg-gradient-to-br from-orange-900 to-orange-700";
		if (heartRate > 80)
			return "bg-gradient-to-br from-yellow-900 to-yellow-700";
		return "bg-gradient-to-br from-pink-900 to-purple-900";
	};

	return (
		<div
			className={`min-h-screen flex flex-col items-center justify-center transition-all duration-1000 ${getBackgroundClass()}`}
		>
			<div className="text-center space-y-8">
				{/* ... (Heart Icon and Heart Rate Display are unchanged) */}

				{!permissionGranted && (
					<div className="mt-8">
						<button
							onClick={requestMotionPermission}
							className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
						>
							Enable Shake Detection
						</button>
					</div>
				)}
				{permissionGranted && (
					<>
						<div className="relative">
							<Heart
								className={`w-32 h-32 mx-auto transition-all duration-150 ${getHeartColor()} ${
									beat
										? "scale-125 drop-shadow-2xl"
										: "scale-100"
								}`}
								fill="currentColor"
							/>
							{beat && (
								<div className="absolute inset-0 w-32 h-32 mx-auto">
									<div className="w-full h-full rounded-full bg-white/20 animate-ping"></div>
								</div>
							)}
						</div>
						<div className="text-white text-center space-y-4">
							<div className="text-6xl font-bold font-mono">
								{heartRate}
								<span className="text-3xl ml-2">BPM</span>
							</div>
							<div className="text-xl font-medium">
								{getStatusText()}
							</div>
							{isShaking && (
								<div className="flex items-center justify-center space-x-2 text-yellow-300 animate-pulse">
									<div className="w-3 h-3 bg-yellow-300 rounded-full animate-bounce"></div>
									<span className="text-lg">
										Shake detected!
									</span>
									<div
										className="w-3 h-3 bg-yellow-300 rounded-full animate-bounce"
										style={{ animationDelay: "0.1s" }}
									></div>
								</div>
							)}
						</div>
					</>
				)}
				<div className="text-white/70 text-center max-w-md mx-auto px-4">
					<p className="text-sm">
						Shake your device or move your mouse rapidly to increase
						the heart rate. The heart will gradually return to
						normal when you stop.
					</p>
				</div>
			</div>
		</div>
	);
}

export default App;
