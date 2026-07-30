import Category from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import slugify from "slugify";
import { buildCategoryTree } from "../utils/categoryTree.js";
import { getSeedCategoryDocs } from "../utils/categorySeed.js";

const streamUpload = (buffer, folder = "categories") =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });

const makeSlug = (name, suffix = "") => {
    const base = slugify(name, { lower: true, strict: true });
    return suffix ? `${base}-${suffix}` : base;
};

const serializeCategory = (cat) => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image: cat.image,
    parent: cat.parent?._id || cat.parent || null,
    navGroup: cat.navGroup,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
    showInMegaMenu: cat.showInMegaMenu,
    seo: cat.seo,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
});

// GET /api/categories/menu — public mega menu payload
export const getCategoryMenu = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true, showInMegaMenu: true })
            .sort({ sortOrder: 1 })
            .lean();

        const tree = buildCategoryTree(categories);

        const main = tree.filter((c) => c.navGroup === "main");
        const featured = tree.filter((c) => c.navGroup === "featured");

        res.status(200).json({
            success: true,
            menu: { main, featured },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/categories — public flat list (active) or admin tree
export const getCategories = async (req, res) => {
    try {
        const isAdmin = req.query.admin === "true";

        const filter = isAdmin ? {} : { isActive: true };
        const categories = await Category.find(filter)
            .populate("parent", "name slug")
            .sort({ sortOrder: 1 })
            .lean();

        if (req.query.format === "tree") {
            const serialized = categories.map(serializeCategory);
            const tree = buildCategoryTree(serialized);

            return res.status(200).json({
                success: true,
                categories: tree,
                flat: serialized,
            });
        }

        res.status(200).json({
            success: true,
            categories: categories.map(serializeCategory),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/categories/slug/:slug
export const getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug })
            .populate("parent", "name slug")
            .lean();

        if (!category || (!category.isActive && !req.user?.isAdmin)) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const descendants = await Category.find({
            slug: new RegExp(`^${category.slug}(-|$)`),
            isActive: true,
        }).select("slug name");

        res.status(200).json({
            success: true,
            category: serializeCategory(category),
            descendantSlugs: descendants.map((d) => d.slug),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const parseSeo = (raw, fallback = {}) => {
    if (!raw) return fallback;
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }
    return raw;
};

// POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const {
            name,
            description = "",
            parent = null,
            navGroup = "main",
            sortOrder = 0,
            isActive = true,
            showInMegaMenu = true,
        } = req.body;

        const seo = parseSeo(req.body.seo, {});

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        let baseSlug = makeSlug(name.trim());
        let uniqueSlug = baseSlug;
        let counter = 1;

        while (await Category.findOne({ slug: uniqueSlug })) {
            uniqueSlug = makeSlug(name.trim(), String(counter++));
        }

        let image = { url: "", public_id: "" };

        if (req.file) {
            const result = await streamUpload(req.file.buffer);
            image = { url: result.secure_url, public_id: result.public_id };
        }

        const category = await Category.create({
            name: name.trim(),
            slug: uniqueSlug,
            description,
            image,
            parent: parent || null,
            navGroup,
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive === true || isActive === "true",
            showInMegaMenu: showInMegaMenu === true || showInMegaMenu === "true",
            seo: {
                metaTitle: seo.metaTitle || "",
                metaDescription: seo.metaDescription || "",
                metaKeywords: seo.metaKeywords || "",
            },
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: serializeCategory(category.toObject()),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const {
            name,
            description,
            parent,
            navGroup,
            sortOrder,
            isActive,
            showInMegaMenu,
        } = req.body;

        const seo = parseSeo(req.body.seo);

        if (name?.trim()) category.name = name.trim();

        if (description !== undefined) category.description = description;
        if (parent !== undefined) category.parent = parent || null;
        if (navGroup) category.navGroup = navGroup;
        if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
        if (isActive !== undefined) {
            category.isActive = isActive === true || isActive === "true";
        }
        if (showInMegaMenu !== undefined) {
            category.showInMegaMenu = showInMegaMenu === true || showInMegaMenu === "true";
        }

        if (seo) {
            category.seo = {
                metaTitle: seo.metaTitle ?? category.seo.metaTitle,
                metaDescription: seo.metaDescription ?? category.seo.metaDescription,
                metaKeywords: seo.metaKeywords ?? category.seo.metaKeywords,
            };
        }

        if (req.file) {
            if (category.image?.public_id) {
                await cloudinary.uploader.destroy(category.image.public_id);
            }
            const result = await streamUpload(req.file.buffer);
            category.image = { url: result.secure_url, public_id: result.public_id };
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: serializeCategory(category.toObject()),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/categories/reorder
export const reorderCategories = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items array is required",
            });
        }

        const bulkOps = items.map(({ id, sortOrder, parent }) => ({
            updateOne: {
                filter: { _id: id },
                update: {
                    sortOrder: Number(sortOrder),
                    ...(parent !== undefined ? { parent: parent || null } : {}),
                },
            },
        }));

        await Category.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: "Categories reordered successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const childCount = await Category.countDocuments({ parent: category._id });

        if (childCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Remove or reassign subcategories before deleting",
            });
        }

        if (category.image?.public_id) {
            await cloudinary.uploader.destroy(category.image.public_id);
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/categories/seed
export const seedCategories = async (req, res) => {
    try {
        const existing = await Category.countDocuments();

        if (existing > 0 && !req.body.force) {
            return res.status(400).json({
                success: false,
                message: "Categories already exist. Pass force: true to re-seed.",
            });
        }

        if (req.body.force) {
            await Category.deleteMany({});
        }

        const seedDocs = getSeedCategoryDocs();
        const slugToId = {};

        for (const doc of seedDocs.filter((d) => !d.parentSlug)) {
            const created = await Category.create({
                name: doc.name,
                slug: doc.slug,
                parent: null,
                navGroup: doc.navGroup,
                sortOrder: doc.sortOrder,
                isActive: true,
                showInMegaMenu: true,
            });
            slugToId[doc.slug] = created._id;
        }

        const remaining = seedDocs.filter((d) => d.parentSlug);

        let safety = 0;
        while (remaining.length && safety < 20) {
            safety += 1;
            for (let i = remaining.length - 1; i >= 0; i -= 1) {
                const doc = remaining[i];
                const parentId = slugToId[doc.parentSlug];

                if (!parentId) continue;

                const created = await Category.create({
                    name: doc.name,
                    slug: doc.slug,
                    parent: parentId,
                    navGroup: doc.navGroup,
                    sortOrder: doc.sortOrder,
                    isActive: true,
                    showInMegaMenu: true,
                });

                slugToId[doc.slug] = created._id;
                remaining.splice(i, 1);
            }
        }

        const count = await Category.countDocuments();

        res.status(201).json({
            success: true,
            message: `Seeded ${count} categories successfully`,
            count,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
