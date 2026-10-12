const overlay = document.querySelector(".preloader-overlay");
const loader = document.querySelector(".preloader");
const loadingCopy = document.querySelector(".preloader-copy p");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const nestedBlocks = Array.from(
	document.querySelectorAll(".preloader-block .preloader-block")
);

const closeNavigation = () => {
	if (!navToggle || !navLinks) return;
	navToggle.setAttribute("aria-expanded", "false");
	navToggle.setAttribute("aria-label", "Abrir menu");
	navLinks.classList.remove("is-open");
};

navToggle?.addEventListener("click", () => {
	const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
	navToggle.setAttribute("aria-expanded", String(!isExpanded));
	navToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
	navLinks?.classList.toggle("is-open", !isExpanded);
});

navLinks?.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", closeNavigation);
});

const categoryTrack = document.querySelector(".category-track");
const newsletterDialog = document.querySelector("#newsletter-dialog");
const newsletterOpenButton = document.querySelector("#newsletter-open");
const newsletterForm = document.querySelector("#newsletter-form");
const newsletterEmail = document.querySelector("#newsletter-email");
const newsletterThanks = document.querySelector("#newsletter-thanks");
let isDraggingCategories = false;
let categoryPointerDown = false;
let categoryPointerId = null;
let categoryDragStartX = 0;
let categoryScrollStart = 0;
let categoryClickResetTimer;

const openNewsletterDialog = () => {
	if (newsletterDialog && !newsletterDialog.open) newsletterDialog.showModal();
};

const skipHomePreloader = () => {
	try {
		const arrivedByPageTransition =
			window.sessionStorage.getItem("mumuso-page-transition") === "true";
		window.sessionStorage.removeItem("mumuso-page-transition");
		return arrivedByPageTransition;
	} catch (error) {
		console.error("Unable to check the page transition state:", error);
		return false;
	}
};

if (newsletterDialog) {
	if (!(newsletterForm instanceof HTMLFormElement) ||
		!(newsletterEmail instanceof HTMLInputElement) ||
		!(newsletterThanks instanceof HTMLElement)) {
		throw new Error("The newsletter dialog is missing required form elements.");
	}

	newsletterOpenButton?.addEventListener("click", openNewsletterDialog);

	newsletterDialog.querySelectorAll("[data-newsletter-dismiss]").forEach((button) => {
		button.addEventListener("click", () => newsletterDialog.close());
	});

	newsletterDialog.addEventListener("close", () => {
		newsletterForm.reset();
		newsletterForm.hidden = false;
		newsletterThanks.hidden = true;
	});

	newsletterForm.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!newsletterForm.reportValidity()) return;

		newsletterEmail.value = "";
		newsletterForm.hidden = true;
		newsletterThanks.hidden = false;
		newsletterThanks.focus();
	});
}

categoryTrack?.addEventListener("pointerdown", (event) => {
	if (event.pointerType !== "mouse" || event.button !== 0) return;
	window.clearTimeout(categoryClickResetTimer);
	categoryPointerDown = true;
	isDraggingCategories = false;
	categoryPointerId = event.pointerId;
	categoryDragStartX = event.clientX;
	categoryScrollStart = categoryTrack.scrollLeft;
});

window.addEventListener("pointermove", (event) => {
	if (!categoryPointerDown || event.pointerId !== categoryPointerId) return;
	const distance = event.clientX - categoryDragStartX;
	if (Math.abs(distance) > 5) {
		isDraggingCategories = true;
		categoryTrack.classList.add("is-dragging");
	}
	if (isDraggingCategories) categoryTrack.scrollLeft = categoryScrollStart - distance;
});

window.addEventListener("pointerup", (event) => {
	if (event.pointerId !== categoryPointerId) return;
	categoryPointerDown = false;
	categoryPointerId = null;
	categoryTrack.classList.remove("is-dragging");
	if (isDraggingCategories) {
		categoryClickResetTimer = window.setTimeout(() => {
			isDraggingCategories = false;
		}, 100);
	}
});

window.addEventListener("pointercancel", (event) => {
	if (event.pointerId !== categoryPointerId) return;
	categoryPointerDown = false;
	categoryPointerId = null;
	isDraggingCategories = false;
	categoryTrack.classList.remove("is-dragging");
	window.clearTimeout(categoryClickResetTimer);
});

categoryTrack?.addEventListener(
	"click",
	(event) => {
		if (!isDraggingCategories) return;
		event.preventDefault();
		isDraggingCategories = false;
		window.clearTimeout(categoryClickResetTimer);
	},
	true
);

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") closeNavigation();
});

window.addEventListener("resize", () => {
	if (window.innerWidth > 768) closeNavigation();
});

const pageReady =
	document.readyState === "complete"
		? Promise.resolve()
		: new Promise((resolve) => {
				window.addEventListener("load", resolve, { once: true });
			});

const wait = (duration) =>
	new Promise((resolve) => window.setTimeout(resolve, duration));

const animate = (element, keyframes, options) => {
	if (!element) return Promise.resolve();
	const animation = element.animate(keyframes, options);
	const fallbackDuration = (options.delay || 0) + options.duration + 150;
	return Promise.race([
		animation.finished.catch(() => {}),
		wait(fallbackDuration),
	]);
};

const revealPage = async () => {
	if (skipHomePreloader()) {
		document.body.classList.add("loaded");
		overlay?.remove();
		return;
	}

	if (!overlay || !loader || !loadingCopy) {
		document.body.classList.add("loaded");
		return;
	}

	const characters = Array.from(loadingCopy.textContent, (character) => {
		const span = document.createElement("span");
		span.className = "char";
		span.textContent = character === " " ? "\u00a0" : character;
		span.setAttribute("aria-hidden", "true");
		return span;
	});

	loadingCopy.replaceChildren(...characters);

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		await pageReady;
		document.body.classList.add("loaded");
		overlay.remove();
		return;
	}

	const textAnimation = Promise.all(
		characters.map((character, index) =>
			animate(
				character,
				[{ opacity: 0 }, { opacity: 1 }],
				{ delay: index * 100, duration: 150, fill: "forwards" }
			)
		)
	);

	loader.animate(
		[{ transform: "scale(0)" }, { transform: "scale(1)" }],
		{
			duration: 350,
			easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
			fill: "forwards",
		}
	);

	await Promise.all([textAnimation, pageReady]);

	await Promise.all(
		nestedBlocks.map((block, index) =>
			animate(
				block,
				[{ transform: "rotate(-180deg)" }, { transform: "rotate(0deg)" }],
				{
					delay: 250 + index * 750,
					duration: 650,
					easing: "cubic-bezier(0.65, 0, 0.35, 1)",
					fill: "forwards",
				}
			)
		)
	);

	await Promise.all([
		animate(
			loader,
			[{ opacity: 1 }, { opacity: 0 }],
			{ duration: 500, fill: "forwards" }
		),
		animate(
			document.querySelector(".preloader-copy"),
			[{ opacity: 1 }, { opacity: 0 }],
			{ duration: 500, fill: "forwards" }
		),
	]);

	document.body.classList.add("loaded");
	await animate(
		overlay,
		[{ "--wipe": "0deg" }, { "--wipe": "360deg" }],
		{ duration: 1000, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
	);
	overlay.remove();
};

revealPage();

const parallaxImages = Array.from(document.querySelectorAll(".img img"));

const lerp = (start, end, factor) => start + (end - start) * factor;

const images = parallaxImages.map((image) => ({
	element: image,
	top: 0,
	currentTranslateY: 0,
	targetTranslateY: 0,
}));

const updateBounds = () => {
	images.forEach((image) => {
		const rect = image.element.getBoundingClientRect();
		image.top = rect.top + window.scrollY;
	});
};

const updateTargets = () => {
	images.forEach((image) => {
		image.targetTranslateY = (window.scrollY - image.top) * 0.2;
	});
};

const animateParallax = () => {
	images.forEach((image) => {
		image.currentTranslateY = lerp(
			image.currentTranslateY,
			image.targetTranslateY,
			0.1
		);

		if (Math.abs(image.currentTranslateY - image.targetTranslateY) > 0.01) {
			image.element.style.transform = `translateY(${image.currentTranslateY}px) scale(1.5)`;
		}
	});

	requestAnimationFrame(animateParallax);
};

images.forEach(({ element }) => {
	element.style.transform = "translateY(0) scale(1.25)";
});

updateBounds();
updateTargets();
window.addEventListener("resize", updateBounds);
window.addEventListener("scroll", updateTargets, { passive: true });
window.addEventListener("load", updateBounds);
requestAnimationFrame(animateParallax);
