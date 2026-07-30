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

export const flattenTreeForSelect = (tree, depth = 0) => {
  const items = []
  tree.forEach((node) => {
    items.push({
      _id: node._id,
      name: node.name,
      slug: node.slug,
      depth,
      label: `${'— '.repeat(depth)}${node.name}`,
      navGroup: node.navGroup,
    })
    if (node.children?.length) {
      items.push(...flattenTreeForSelect(node.children, depth + 1))
    }
  })
  return items
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
