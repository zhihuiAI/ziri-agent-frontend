/**
 * Tool executor abstraction for Electron environment.
 * Migrated from frontend-react/src/services/toolExecutor.ts
 */

declare global {
  interface Window {
    electronAPI?: {
      setUserId: (userId: string) => void
      getUserId: () => Promise<string>
      runCommand?: (command: string, cwd?: string) => Promise<{
        success: boolean
        stdout: string
        stderr: string
        exitCode: number
      }>
      listDirectory?: (path: string) => Promise<{
        success: boolean
        files: Array<{ name: string; path: string; isDirectory: boolean; size: number }>
      }>
      readFile?: (path: string) => Promise<{ success: boolean; content: string }>
      writeFile?: (path: string, content: string) => Promise<{ success: boolean }>
      deleteFile?: (path: string) => Promise<{ success: boolean }>
      createDirectory?: (path: string) => Promise<{ success: boolean }>
      getFileInfo?: (path: string) => Promise<{
        success: boolean
        size: number
        created: string
        modified: string
        isDirectory: boolean
      }>
      runPython?: (code: string) => Promise<{ success: boolean; stdout: string; stderr: string }>
      checkPython?: () => Promise<{ available: boolean; version: string }>
      checkNodeVersion?: () => Promise<{ installed: boolean; version: string; isV21OrHigher: boolean }>
      installOpenCLI?: () => Promise<{
        success: boolean | null; steps: Array<{
          name: string; status: string; message: string; output?: string
          manualInstruction?: string; manualUrl?: string; requiresConfirmation?: boolean
        }>; overallStatus: string; message: string; sessionId?: string
        waitingForConfirmation?: boolean; completed?: boolean
      }>
      continueInstallOpenCLI?: (opts: { sessionId: string }) => Promise<{
        success: boolean | null; steps: Array<{
          name: string; status: string; message: string; output?: string
        }>; overallStatus: string; message: string; sessionId?: string
        waitingForConfirmation?: boolean; completed?: boolean
      }>
      checkOpenCLIStatus?: () => Promise<{ status: string; message: string }>
      installOfficeCLI?: () => Promise<{
        success: boolean | null; steps: Array<{
          name: string; status: string; message: string; output?: string
        }>; overallStatus: string; message: string
      }>
      checkOfficeCLIStatus?: () => Promise<{ installed: boolean; version: string | null; status: string; message: string }>
      selectDirectory?: () => Promise<{ success: boolean; path: string | null; canceled?: boolean }>
      platform?: string
      isElectron?: boolean
    }
  }
}

export function isElectron(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    window.electronAPI ||
    navigator.userAgent.toLowerCase().includes('electron')
  )
}

export function getElectronAPI() {
  if (typeof window === 'undefined') return null
  return window.electronAPI || null
}

export async function syncUserId(userId: string) {
  const api = getElectronAPI()
  if (api) {
    api.setUserId(userId)
  }
}

export async function clearUserId() {
  const api = getElectronAPI()
  if (api) {
    api.setUserId('')
  }
}

export { isElectron as isElectronEnv }
