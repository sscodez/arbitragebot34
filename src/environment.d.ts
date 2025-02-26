/// <reference types="vite/client" />

declare module '*.tsx' {
  import React from 'react'
  const Component: React.ComponentType
  export default Component
}

declare module '*.ts' {
  const content: any
  export default content
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly REACT_APP_RPC_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
