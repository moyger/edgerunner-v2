import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../uiStore'
import type { TabId } from '../../types'

// Helper to get a fresh store instance for each test
const getInitialStoreState = () => useUIStore.getState()

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeTab: 'dashboard',
      sidebarCollapsed: false,
      theme: 'system',
    })
  })

  it('has correct initial state', () => {
    const state = getInitialStoreState()
    expect(state.activeTab).toBe('dashboard')
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.theme).toBe('system')
  })

  it('can set active tab', () => {
    const { setActiveTab } = useUIStore.getState()
    
    setActiveTab('strategies' as TabId)
    
    expect(useUIStore.getState().activeTab).toBe('strategies')
  })

  it('can toggle sidebar', () => {
    const { toggleSidebar } = useUIStore.getState()
    
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    
    toggleSidebar()
    
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    
    toggleSidebar()
    
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  })

  it('can set sidebar collapsed state', () => {
    const { setSidebarCollapsed } = useUIStore.getState()
    
    setSidebarCollapsed(true)
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    
    setSidebarCollapsed(false)
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  })

  it('can set theme', () => {
    const { setTheme } = useUIStore.getState()
    
    setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
    
    setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
  })

  it('returns correct page titles', () => {
    const { getPageTitle, setActiveTab } = useUIStore.getState()
    
    setActiveTab('dashboard')
    expect(getPageTitle()).toBe('Dashboard')
    
    setActiveTab('strategies')
    expect(getPageTitle()).toBe('Strategies')
    
    setActiveTab('journal')
    expect(getPageTitle()).toBe('Trade Journal')
    
    setActiveTab('settings')
    expect(getPageTitle()).toBe('Settings')
  })

  it('returns correct page subtitles', () => {
    const { getPageSubtitle, setActiveTab } = useUIStore.getState()
    
    setActiveTab('dashboard')
    expect(getPageSubtitle()).toBe('Real-time overview of your trading performance')
    
    setActiveTab('strategies')
    expect(getPageSubtitle()).toBe('Create and manage your algorithmic trading strategies')
    
    setActiveTab('journal')
    expect(getPageSubtitle()).toBe('Complete trading history and performance analytics')
  })
})