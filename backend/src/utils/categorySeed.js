import slugify from "slugify";

const slug = (name) =>
    slugify(name, { lower: true, strict: true });

const categoryDefinitions = {
    men: {
        name: "Men",
        children: [
            "New Arrivals",
            "Trending",
            "T-Shirts",
            "Oversized T-Shirts",
            "Shirts",
            "Hoodies & Sweatshirts",
            {
                name: "Bottom Wear",
                children: ["Jeans", "Cargo Pants", "Joggers", "Shorts"],
            },
            {
                name: "Footwear",
                children: ["Sneakers", "Casual Shoes", "Slides"],
            },
            "Sale",
        ],
    },
    women: {
        name: "Women",
        children: [
            "New Arrivals",
            "Trending",
            "Tops",
            "Oversized T-Shirts",
            "Dresses",
            "Hoodies & Sweatshirts",
            {
                name: "Bottom Wear",
                children: ["Jeans", "Cargo Pants", "Skirts", "Shorts"],
            },
            {
                name: "Footwear",
                children: ["Sneakers", "Heels", "Flats"],
            },
            "Sale",
        ],
    },
    featured: [
        "Best Sellers",
        "Streetwear",
        "Co-ord Sets",
        "Summer Collection",
        "Winter Collection",
    ],
};

const buildDocs = (items, parentSlug = null, navGroup = "main", sortStart = 0) => {
    const docs = [];
    let order = sortStart;

    items.forEach((item) => {
        if (typeof item === "string") {
            const name = item;
            const itemSlug = parentSlug ? `${parentSlug}-${slug(name)}` : slug(name);

            docs.push({
                name,
                slug: itemSlug,
                parentSlug,
                navGroup,
                sortOrder: order++,
            });
            return;
        }

        const name = item.name;
        const itemSlug = parentSlug ? `${parentSlug}-${slug(name)}` : slug(name);

        docs.push({
            name,
            slug: itemSlug,
            parentSlug,
            navGroup,
            sortOrder: order++,
        });

        if (item.children?.length) {
            docs.push(
                ...buildDocs(item.children, itemSlug, navGroup, 0)
            );
        }
    });

    return docs;
};

export const getSeedCategoryDocs = () => {
    const docs = [];

    ["men", "women"].forEach((key) => {
        const group = categoryDefinitions[key];
        docs.push({
            name: group.name,
            slug: key,
            parentSlug: null,
            navGroup: "main",
            sortOrder: key === "men" ? 0 : 1,
        });

        docs.push(...buildDocs(group.children, key, "main", 0));
    });

    categoryDefinitions.featured.forEach((name, index) => {
        docs.push({
            name,
            slug: slug(name),
            parentSlug: null,
            navGroup: "featured",
            sortOrder: index,
        });
    });

    return docs;
};

export default getSeedCategoryDocs;
