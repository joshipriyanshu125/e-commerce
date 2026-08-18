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

export const groupCategoriesForSelect = (inputCategories) => {
  if (!Array.isArray(inputCategories) || inputCategories.length === 0) return []

  // Ensure tree hierarchy is resolved if flat list with parent links was provided
  let tree = inputCategories
  const isFlat = inputCategories.some(cat => cat.parent && (!cat.children || cat.children.length === 0))

  if (isFlat) {
    const map = {}
    const roots = []
    inputCategories.forEach(cat => {
      map[cat._id || cat.slug] = { ...cat, children: [] }
    })
    inputCategories.forEach(cat => {
      const parentId = typeof cat.parent === 'object' ? cat.parent?._id : cat.parent
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[cat._id || cat.slug])
      } else {
        roots.push(map[cat._id || cat.slug])
      }
    })
    tree = roots
  }

  // Fallback defaults for Men & Women subcategories to guarantee populated lists
  const defaultMenSubcategories = [
    { name: 'T-Shirts', slug: 'men-t-shirts' },
    { name: 'Oversized T-Shirts', slug: 'men-oversized-t-shirts' },
    { name: 'Shirts', slug: 'men-shirts' },
    { name: 'Hoodies & Sweatshirts', slug: 'men-hoodies-sweatshirts' },
    { name: 'Jeans', slug: 'men-bottom-wear-jeans' },
    { name: 'Cargo Pants', slug: 'men-bottom-wear-cargo-pants' },
    { name: 'Joggers', slug: 'men-bottom-wear-joggers' },
    { name: 'Shorts', slug: 'men-bottom-wear-shorts' },
    { name: 'Sneakers', slug: 'men-footwear-sneakers' },
    { name: 'Casual Shoes', slug: 'men-footwear-casual-shoes' },
    { name: 'Slides', slug: 'men-footwear-slides' },
  ]

  const defaultWomenSubcategories = [
    { name: 'Tops', slug: 'women-tops' },
    { name: 'Oversized T-Shirts', slug: 'women-oversized-t-shirts' },
    { name: 'Dresses', slug: 'women-dresses' },
    { name: 'Hoodies & Sweatshirts', slug: 'women-hoodies-sweatshirts' },
    { name: 'Jeans', slug: 'women-bottom-wear-jeans' },
    { name: 'Cargo Pants', slug: 'women-bottom-wear-cargo-pants' },
    { name: 'Skirts', slug: 'women-bottom-wear-skirts' },
    { name: 'Shorts', slug: 'women-bottom-wear-shorts' },
    { name: 'Sneakers', slug: 'women-footwear-sneakers' },
    { name: 'Heels', slug: 'women-footwear-heels' },
    { name: 'Flats', slug: 'women-footwear-flats' },
  ]

  // Find Men node & Women node
  const menNode = tree.find(c => (c.slug || '').toLowerCase() === 'men' || (c.name || '').toLowerCase() === 'men')
  const womenNode = tree.find(c => (c.slug || '').toLowerCase() === 'women' || (c.name || '').toLowerCase() === 'women')

  // Collect men & women children
  const menChildren = menNode?.children && menNode.children.length > 0
    ? menNode.children
    : inputCategories.filter(c => {
        const slug = (c.slug || '').toLowerCase()
        const p = String(c.parentSlug || c.parent || '').toLowerCase()
        return (slug.startsWith('men-') || p.includes('men')) && slug !== 'men'
      })

  const womenChildren = womenNode?.children && womenNode.children.length > 0
    ? womenNode.children
    : inputCategories.filter(c => {
        const slug = (c.slug || '').toLowerCase()
        const p = String(c.parentSlug || c.parent || '').toLowerCase()
        return (slug.startsWith('women-') || p.includes('women')) && slug !== 'women'
      })

  // Build options lists for Men section
  const menOptions = [
    { _id: menNode?._id || 'men', name: 'Men (All Men)', slug: 'men', label: 'Men — All Products' }
  ]
  const activeMenList = menChildren.length > 0 ? menChildren : defaultMenSubcategories
  activeMenList.forEach(child => {
    if (child.children && child.children.length > 0) {
      child.children.forEach(sub => {
        menOptions.push({
          _id: sub._id || sub.slug,
          name: sub.name,
          slug: sub.slug,
          label: `Men — ${sub.name} (${child.name})`,
        })
      })
    } else {
      menOptions.push({
        _id: child._id || child.slug,
        name: child.name,
        slug: child.slug,
        label: `Men — ${child.name}`,
      })
    }
  })

  // Build options lists for Women section
  const womenOptions = [
    { _id: womenNode?._id || 'women', name: 'Women (All Women)', slug: 'women', label: 'Women — All Products' }
  ]
  const activeWomenList = womenChildren.length > 0 ? womenChildren : defaultWomenSubcategories
  activeWomenList.forEach(child => {
    if (child.children && child.children.length > 0) {
      child.children.forEach(sub => {
        womenOptions.push({
          _id: sub._id || sub.slug,
          name: sub.name,
          slug: sub.slug,
          label: `Women — ${sub.name} (${child.name})`,
        })
      })
    } else {
      womenOptions.push({
        _id: child._id || child.slug,
        name: child.name,
        slug: child.slug,
        label: `Women — ${child.name}`,
      })
    }
  })

  // Build options list for Featured & Collections section
  const featuredOptions = []
  const featuredNodes = tree.filter(c => {
    const slug = (c.slug || '').toLowerCase()
    return slug !== 'men' && slug !== 'women' && !slug.startsWith('men-') && !slug.startsWith('women-')
  })

  featuredNodes.forEach(node => {
    featuredOptions.push({
      _id: node._id || node.slug,
      name: node.name,
      slug: node.slug,
      label: node.name,
    })
  })

  const groups = []
  if (menOptions.length > 0) {
    groups.push({ label: '👨 MEN', options: menOptions })
  }
  if (womenOptions.length > 0) {
    groups.push({ label: '👩 WOMEN', options: womenOptions })
  }
  if (featuredOptions.length > 0) {
    groups.push({ label: '⭐ FEATURED & COLLECTIONS', options: featuredOptions })
  }

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
