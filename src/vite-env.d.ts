/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_AI_API_URL: string
  readonly VITE_AI_API_KEY: string
  readonly VITE_HOTMART_CLIENT_ID: string
  readonly VITE_HOTMART_CLIENT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 