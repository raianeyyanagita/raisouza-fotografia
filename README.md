# 📸 Ráimes Souza — Fotografia de Gestação, Parto & Família

Site institucional e portfólio interativo com paleta em tons claros e pastéis sofisticados, integrado com **Painel Administrativo Exclusivo da Fotógrafa** para gerenciamento de preços, planos e fotos em tempo real.

## ✨ Funcionalidades
- **Front-end Editorial Pastel & Responsivo**: Paleta suave em marfim, linho, rosé antigo e sálvia com tipografia editorial.
- **Galeria Filtrável com Lightbox**: Categorias para *Parto ("Cheguei!")*, *Gestante & Família*, *Lifestyle & Pets* e *Primeiros Dias (Baby)*.
- **Tabela de Investimentos & Planos Dinâmica**: Ensaios em Estúdio (Bairro Tupi - BH), Externo, Lifestyle, Lifestyle Baby e Planos Bronze, Prata, Ouro e Diamante.
- **Contato Direto via WhatsApp**: Botões e formulário que formatam o orçamento direto para o WhatsApp da Ráimes `(31) 99590-5082`.
- **Painel Admin Restrito (`/api/site`, `/api/auth`, `/api/upload`)**: Permite à fotógrafa alterar preços, textos, formas de pagamento, taxas de maternidade e fazer upload de novas fotos.

## 🚀 Como rodar localmente
```bash
ruby server.rb
```
Acesse no navegador: **http://localhost:3333**

### 🔒 Acesso Administrativo Inicial
- Clique no ícone de cadeado no topo/rodapé ou acesse `http://localhost:3333/?admin`
- **Usuário padrão:** `raimes`
- **Senha padrão:** `123456` *(pode ser alterada dentro do próprio painel)*
