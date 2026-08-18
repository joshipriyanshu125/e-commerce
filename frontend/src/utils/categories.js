import { useState, useEffect, useCallback } from 'react'
import api from '../services/axiosInstance'

let menuCache = null
let menuPromise = null

export const fetchCategoryMenu = async () => {
  if (menuCache) return menuCache
  if (menuPromise) return menuPromise

  menuPromise = api.get('categories/menu').then((res) => {
    if (res.data.success) {
      menuCache = res.data.menu
      return menuCache
    }
    return { main: [], featured: [] }
  }).finally(() => {
    menuPromise = null
  })

  return menuPromise
}

export const fetchCategoriesAdmin = async () => {
  const res = await api.get('categories?admin=true&format=tree')
  if (res.data.success) {
    return { tree: res.data.categories, flat: res.data.flat || [] }
  }
  return { tree: [], flat: [] }
}

export const fetchCategoriesFlat = async () => {
  const res = await api.get('categories')
  if (res.data.success) return res.data.categories || []
  return []
}

export const invalidateCategoryMenuCache = () => {
  menuCache = null
}

export const useCategoryMenu = () => {
  const [menu, setMenu] = useState({ main: [], featured: [] })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchCategoryMenu()
      setMenu(data)
    } catch {
      setMenu({ main: [], featured: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { menu, loading, reload: load }
}

export const getCategoryLink = (slug, parentSlug = null) => {
  return `/shop/${slug}`
}

export const flattenTreeForSelect = (tree, depth = 0, parentName = '') => {
  const items = []
  if (!Array.isArray(tree)) return items

  tree.forEach((node) => {
    const displayName = parentName ? `${parentName} — ${node.name}` : node.name
    items.push({
      _id: node._id,
      name: node.name,
      slug: node.slug,
      depth,
      parentName,
      label: depth > 0 ? `${displayName}` : node.name,
      navGroup: node.navGroup,
    })
    if (node.children?.length) {
      const nextParent = parentName ? `${parentName} — ${node.name}` : node.name
      items.push(...flattenTreeForSelect(node.children, depth + 1, nextParent))
    }
  })
  return items
}

export const groupCategoriesForSelect = (tree) => {
  if (!Array.isArray(tree) || tree.length === 0) return []

  const groups = []

  tree.forEach((topNode) => {
    const parentName = topNode.name
    const slugLower = (topNode.slug || '').toLowerCase()

    let icon = '📁 '
    if (slugLower === 'men') icon = '👨 '
    else if (slugLower === 'women') icon = '👩 '
    else if (topNode.navGroup === 'featured') icon = '⭐ '

    const groupOptions = []

    // Top-level category option
    groupOptions.push({
      _id: topNode._id,
      name: topNode.name,
      slug: topNode.slug,
      label: `${topNode.name} (All ${topNode.name})`,
    })

    // Subcategories recursively
    const collectChildren = (children, prefix) => {
      children.forEach(child => {
        const fullLabel = `${prefix} — ${child.name}`
        groupOptions.push({
          _id: child._id,
          name: child.name,
          slug: child.slug,
          label: fullLabel,
        })
        if (child.children?.length) {
          collectChildren(child.children, fullLabel)
        }
      })
    }

    if (topNode.children?.length) {
      collectChildren(topNode.children, parentName)
    }

    groups.push({
      label: `${icon}${parentName.toUpperCase()}`,
      options: groupOptions,
    })
  })

  return groups
}

export const findCategoryBySlug = (tree, slug) => {
  for (const node of tree) {
    if (node.slug === slug) return node
    if (node.children?.length) {
      const found = findCategoryBySlug(node.children, slug)
      if (found) return found
    }
  }
  return null
}

export const collectDescendantNames = (node) => {
  const names = [node.name]
  if (node.children?.length) {
    node.children.forEach((child) => {
      names.push(...collectDescendantNames(child))
    })
  }
  return names
}
