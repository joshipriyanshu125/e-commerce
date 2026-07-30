export const buildCategoryTree = (categories, parentId = null) => {
    return categories
        .filter((cat) => {
            const pid = cat.parent?._id || cat.parent || null;
            const compareId = parentId ? String(parentId) : null;
            return pid === compareId;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((cat) => ({
            ...cat,
            children: buildCategoryTree(categories, cat._id),
        }));
};

export const flattenCategoryTree = (tree, depth = 0, parentPath = "") => {
    const result = [];

    tree.forEach((node) => {
        const path = parentPath ? `${parentPath} > ${node.name}` : node.name;

        result.push({
            ...node,
            depth,
            path,
            children: undefined,
        });

        if (node.children?.length) {
            result.push(...flattenCategoryTree(node.children, depth + 1, path));
        }
    });

    return result;
};
