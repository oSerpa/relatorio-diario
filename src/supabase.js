import { createClient } from '@supabase/supabase-js'

// A chave publicável pode ficar no código: quem protege os dados é o RLS do banco.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://fpdgtonwegenwvprjlvk.supabase.co'
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_csw8CAvza5rG3tgSTsUFEA_oFm1Yp5I'

export const supabase = createClient(url, chave)
