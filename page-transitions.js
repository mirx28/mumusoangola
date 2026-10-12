const transitionStorageKey = "mumuso-page-transition";
const transitionDuration = 240;
let navigationStarted = false;

const isPlainLeftClick = (event) =>
	event.button === 0 &&
	!event.metaKey &&
	!event.ctrlKey &&
	!event.shiftKey &&
	!event.altKey;

document.addEventListener("click", (event) => {
	if (!(event instanceof MouseEvent) || !isPlainLeftClick(event) || event.defaultPrevented) return;
	if (!(event.target instanceof Element)) return;

	const link = event.target.closest("a");
	if (
		!(link instanceof HTMLAnchorElement) ||
		link.hasAttribute("download") ||
		(link.target && link.target !== "_self")
	) {
		return;
	}

	const destination = new URL(link.href, window.location.href);
	if (
		destination.origin !== window.location.origin ||
		!["http:", "https:"].includes(destination.protocol) ||
		(destination.pathname === window.location.pathname &&
			destination.search === window.location.search &&
			destination.hash !== window.location.hash)
	) {
		return;
	}

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	event.preventDefault();
	if (navigationStarted) return;
	navigationStarted = true;
	document.documentElement.classList.add("is-transitioning-out");

	if (destination.pathname.endsWith("/index.html") || destination.pathname === "/") {
		try {
			window.sessionStorage.setItem(transitionStorageKey, "true");
		} catch (error) {
			console.error("Unable to prepare the page transition:", error);
		}
	}

	window.requestAnimationFrame(() => {
		document.documentElement.classList.add("is-transition-active");
		window.setTimeout(() => {
			window.location.assign(destination.href);
		}, transitionDuration);
	});
});
