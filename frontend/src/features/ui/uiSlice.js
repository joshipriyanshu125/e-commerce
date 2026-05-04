import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'light',
  isSidebarOpen: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
  },
})

export const { toggleTheme, toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
