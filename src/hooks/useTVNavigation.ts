import { useEffect, useCallback } from "react";

/**
 * Custom hook for TV D-pad/Remote navigation
 * Handles arrow keys, Enter/Select, and Back button
 */
export function useTVNavigation(options?: {
    onBack?: () => void;
    onEnter?: () => void;
    enabled?: boolean;
}) {
    const { onBack, onEnter, enabled = true } = options || {};

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const { key } = event;

            // Handle back button (Backspace or TV remote back button)
            if (key === "Backspace" || key === "XF86Back" || key === "GoBack") {
                event.preventDefault();
                onBack?.();
                return;
            }

            // Handle Enter/Select button
            if (key === "Enter" && onEnter) {
                const target = event.target as HTMLElement;
                // Only prevent default if not in an input/textarea
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    event.preventDefault();
                    onEnter();
                }
            }

            // Arrow key navigation - browser handles focus management
            // We just need to ensure elements are properly focusable
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
                // Let browser handle spatial navigation
                // Custom behavior can be added here if needed
            }
        },
        [enabled, onBack, onEnter]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [enabled, handleKeyDown]);
}

/**
 * Hook to enable spatial navigation for focusable elements
 * Ensures all interactive elements are keyboard-accessible
 */
export function useSpatialNavigation(containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Find all focusable elements
        const focusableElements = container.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        // Ensure all elements have tabindex for keyboard navigation
        focusableElements.forEach((element) => {
            if (!element.hasAttribute("tabindex")) {
                element.setAttribute("tabindex", "0");
            }
        });

        // Add arrow key navigation for grids
        const handleGridNavigation = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (!target.matches('[role="gridcell"], .media-card, .carousel-item')) {
                return;
            }

            const { key } = event;
            if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
                return;
            }

            event.preventDefault();

            const focusableArray = Array.from(focusableElements) as HTMLElement[];
            const currentIndex = focusableArray.indexOf(target);
            if (currentIndex === -1) return;

            const gridColumns = getComputedStyle(container).gridTemplateColumns?.split(" ").length || 5;

            let nextIndex = currentIndex;

            switch (key) {
                case "ArrowRight":
                    nextIndex = Math.min(currentIndex + 1, focusableArray.length - 1);
                    break;
                case "ArrowLeft":
                    nextIndex = Math.max(currentIndex - 1, 0);
                    break;
                case "ArrowDown":
                    nextIndex = Math.min(currentIndex + gridColumns, focusableArray.length - 1);
                    break;
                case "ArrowUp":
                    nextIndex = Math.max(currentIndex - gridColumns, 0);
                    break;
            }

            focusableArray[nextIndex]?.focus();
        };

        container.addEventListener("keydown", handleGridNavigation);

        return () => {
            container.removeEventListener("keydown", handleGridNavigation);
        };
    }, [containerRef]);
}
