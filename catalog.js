const categories = [
	{ id: "beleza", label: "Beleza" },
	{ id: "brinquedos-presentes", label: "Brinquedos E Presentes" },
	{ id: "casa-cozinha", label: "Casa E Cozinha" },
	{ id: "chaveiros", label: "Chaveiros" },
	{ id: "eletronica-aparelhos", label: "Eletrónica E Aparelhos" },
	{ id: "papelaria", label: "Papelaria" },
	{ id: "pastas-viagem", label: "Pastas E Artigos De Viagem" },
	{ id: "saco-presente", label: "Saco De Presente" },
];

const productsPerPage = 12;

const englishSearchAliases = {
	beauty: ["beleza", "cosmeticos", "cuidados da pele"],
	cosmetics: ["cosmeticos", "beleza"],
	skincare: ["cuidados da pele", "beleza"],
	toy: ["brinquedo", "brinquedos"],
	toys: ["brinquedo", "brinquedos"],
	gift: ["presente", "presentes"],
	gifts: ["presente", "presentes"],
	home: ["casa", "lar"],
	kitchen: ["cozinha"],
	keychain: ["chaveiro", "porta-chaves", "pingente de bolsa"],
	keychains: ["chaveiro", "porta-chaves", "pingente de bolsa"],
	keyring: ["chaveiro", "porta-chaves", "pingente de bolsa"],
	electronics: ["eletronica", "aparelhos"],
	electronic: ["eletronica", "aparelhos"],
	headphone: ["fones de ouvido", "auscultadores"],
	headphones: ["fones de ouvido", "auscultadores"],
	headset: ["fones de ouvido", "auscultadores"],
	earphone: ["fones de ouvido", "auscultadores"],
	earphones: ["fones de ouvido", "auscultadores"],
	earbuds: ["fones de ouvido", "auscultadores"],
	wireless: ["sem fio", "sem fios"],
	fan: ["ventilador", "ventoinha"],
	fans: ["ventilador", "ventoinha"],
	speaker: ["alto-falante", "coluna de som"],
	speakers: ["alto-falante", "coluna de som"],
	cup: ["copo", "caneca"],
	cups: ["copo", "caneca"],
	mug: ["caneca", "copo"],
	bottle: ["garrafa"],
	bottles: ["garrafa"],
	notebook: ["caderno"],
	notebooks: ["caderno"],
	stationery: ["papelaria"],
	backpack: ["mochila", "viagem"],
	luggage: ["malas", "viagem"],
	travel: ["viagem", "pastas"],
};

const normalizeText = (value) =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("pt-AO")
		.trim();

const searchMatches = (product, query) => {
	const searchableText = normalizeText(
		[
			product.name,
			product.category,
			product.reference,
			...(product.searchTerms || []),
		].join(" ")
	);
	const terms = normalizeText(query).split(/\s+/).filter(Boolean);

	return terms.every((term) => {
		if (searchableText.includes(term)) return true;
		return (englishSearchAliases[term] || []).some((alias) =>
			searchableText.includes(normalizeText(alias))
		);
	});
};

const createCatalogCard = (product) => {
	const article = document.createElement("article");
	article.className = "catalog-card";

	const image = document.createElement("img");
	image.className = "catalog-card-image";
	image.src = product.image;
	image.alt = product.name;
	image.loading = "lazy";
	image.addEventListener("error", () => {
		image.alt = `${product.name} — imagem indisponível`;
		image.classList.add("is-unavailable");
	}, { once: true });

	const copy = document.createElement("div");
	copy.className = "catalog-card-copy";

	const details = document.createElement("div");
	const category = document.createElement("p");
	category.className = "catalog-card-category";
	category.textContent = product.category;

	const title = document.createElement("h2");
	title.className = "catalog-card-title";
	title.textContent = product.name;
	details.append(category, title);

	const price = document.createElement("p");
	price.className = "catalog-card-price";
	price.textContent =
		product.price == null
			? "Preço a confirmar"
			: `${new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(product.price)} Kz`;

	copy.append(details, price);
	article.append(image, copy);
	return article;
};

const initializeCatalog = async () => {
	const searchInput = document.querySelector("#product-search");
	const filters = document.querySelector("#category-filters");
	const count = document.querySelector("#catalog-count");
	const grid = document.querySelector("#catalog-grid");
	const pagination = document.querySelector("#catalog-pagination");
	const empty = document.querySelector("#catalog-empty");
	const error = document.querySelector("#catalog-error");

	if (!searchInput || !filters || !count || !grid || !pagination || !empty || !error) {
		throw new Error("The product catalog page is missing required elements.");
	}

	const response = await fetch("public/catalog-products.json");
	if (!response.ok) {
		throw new Error(`Could not load product data (${response.status}).`);
	}

	const products = await response.json();
	if (!Array.isArray(products)) {
		throw new Error("The product catalog data has an invalid format.");
	}

	const requestedCategory = new URLSearchParams(window.location.search).get("category");
	let selectedCategory = categories.some(({ id }) => id === requestedCategory)
		? requestedCategory
		: "all";
	let currentPage = Math.max(
		1,
		Number.parseInt(new URLSearchParams(window.location.search).get("page") || "1", 10) || 1
	);
	let searchQuery = "";

	const updateUrl = () => {
		const url = new URL(window.location.href);
		if (selectedCategory === "all") url.searchParams.delete("category");
		else url.searchParams.set("category", selectedCategory);
		if (searchQuery) url.searchParams.set("q", searchQuery);
		else url.searchParams.delete("q");
		if (currentPage === 1) url.searchParams.delete("page");
		else url.searchParams.set("page", String(currentPage));
		window.history.replaceState({}, "", url);
	};

	const renderFilters = () => {
		const allButton = document.createElement("button");
		allButton.className = "catalog-filter";
		allButton.type = "button";
		allButton.textContent = `Todos (${products.length})`;
		allButton.dataset.category = "all";
		allButton.addEventListener("click", () => {
			selectedCategory = "all";
			currentPage = 1;
			updateUrl();
			render();
		});
		filters.append(allButton);

		categories.forEach(({ id, label }) => {
			const categoryCount = products.filter((product) => product.categoryId === id).length;
			const button = document.createElement("button");
			button.className = "catalog-filter";
			button.type = "button";
			button.textContent = `${label} (${categoryCount})`;
			button.dataset.category = id;
			button.addEventListener("click", () => {
				selectedCategory = id;
				currentPage = 1;
				updateUrl();
				render();
			});
			filters.append(button);
		});
	};

	const render = () => {
		const visibleProducts = products.filter((product) => {
			const categoryMatches =
				selectedCategory === "all" || product.categoryId === selectedCategory;
			return categoryMatches && searchMatches(product, searchQuery);
		});

		const pageCount = Math.ceil(visibleProducts.length / productsPerPage);
		currentPage = Math.min(currentPage, Math.max(pageCount, 1));
		const pageStart = (currentPage - 1) * productsPerPage;
		const pageProducts = visibleProducts.slice(pageStart, pageStart + productsPerPage);

		grid.replaceChildren(...pageProducts.map(createCatalogCard));
		count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "produto" : "produtos"}`;
		empty.hidden = visibleProducts.length > 0;
		pagination.hidden = pageCount <= 1;
		pagination.replaceChildren();

		if (pageCount > 1) {
			const previousButton = document.createElement("button");
			previousButton.className = "catalog-page-button";
			previousButton.type = "button";
			previousButton.textContent = "←";
			previousButton.setAttribute("aria-label", "Página anterior");
			previousButton.disabled = currentPage === 1;
			previousButton.addEventListener("click", () => {
				currentPage -= 1;
				updateUrl();
				render();
				grid.scrollIntoView({ block: "start" });
			});

			const pageStatus = document.createElement("span");
			pageStatus.className = "catalog-page-status";
			pageStatus.textContent = `Página ${currentPage} de ${pageCount}`;
			pageStatus.setAttribute("aria-live", "polite");

			const nextButton = document.createElement("button");
			nextButton.className = "catalog-page-button";
			nextButton.type = "button";
			nextButton.textContent = "→";
			nextButton.setAttribute("aria-label", "Página seguinte");
			nextButton.disabled = currentPage === pageCount;
			nextButton.addEventListener("click", () => {
				currentPage += 1;
				updateUrl();
				render();
				grid.scrollIntoView({ block: "start" });
			});

			pagination.append(previousButton, pageStatus, nextButton);
		}

		filters.querySelectorAll(".catalog-filter").forEach((button) => {
			button.setAttribute("aria-pressed", String(button.dataset.category === selectedCategory));
		});
		updateUrl();
	};

	searchInput.addEventListener("input", () => {
		searchQuery = searchInput.value;
		currentPage = 1;
		updateUrl();
		render();
	});

	const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
	searchInput.value = initialQuery;
	searchQuery = initialQuery;
	renderFilters();
	render();
};

initializeCatalog().catch((error) => {
	const errorMessage = document.querySelector("#catalog-error");
	if (errorMessage) errorMessage.hidden = false;
	console.error("Unable to initialize the product catalog:", error);
});
