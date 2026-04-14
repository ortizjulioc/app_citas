'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material'

interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null)

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return context
}

interface ConfirmDialogProviderProps {
  children: ReactNode
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [config, setConfig] = useState<ConfirmDialogOptions & { onConfirm: () => void | Promise<void>; isPending?: boolean } | null>(null)
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((res) => {
      setConfig({ ...options, onConfirm: () => {} })
      setResolve(() => res)
    })
  }, [])

  const handleCancel = useCallback(() => {
    setConfig(null)
    resolve?.(false)
    setResolve(null)
  }, [resolve])

  const handleConfirm = useCallback(async () => {
    if (config?.onConfirm) {
      const result = config.onConfirm()
      if (result instanceof Promise) {
        await result
      }
    }
    setConfig(null)
    resolve?.(true)
    setResolve(null)
  }, [config, resolve])

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {config && (
        <Dialog
          open={true}
          onClose={handleCancel}
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>{config.title}</DialogTitle>
          <DialogContent>
            <DialogContentText
              dangerouslySetInnerHTML={{ __html: config.message }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 6, pb: 6 }}>
            <Button
              onClick={handleCancel}
              color="secondary"
              variant="outlined"
              disabled={config.isPending}
            >
              {config.cancelText || 'Cancelar'}
            </Button>
            <Button
              onClick={handleConfirm}
              color="error"
              variant="contained"
              autoFocus
              disabled={config.isPending}
              startIcon={config.isPending ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {config.isPending ? 'Procesando...' : config.confirmText || 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </ConfirmDialogContext.Provider>
  )
}
