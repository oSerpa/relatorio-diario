# Relatório diário

Site para registrar o dia de trabalho (cobranças, ligações, mensagens, recebimentos por produto e negociações) e exportar o relatório do dia em PDF.

- Front: React + Vite
- Banco e login: Supabase (projeto `relatorio-diario`, tabela `lancamentos`, schema em `supabase/schema.sql`)
- PDF: jsPDF

## Rodar local

```
npm install
npm run dev
```

O deploy roda sozinho no GitHub Pages a cada push na `main`.
