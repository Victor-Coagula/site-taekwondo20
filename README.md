# MCM Taekwondo Team

Site Node.js + Express com notícias, upload de fotos e painel administrativo.

## Estrutura

```text
meu-site/
├── index.html
├── style.css
├── script.js
├── package.json
├── server.js
├── data/
│   └── posts.json
└── public/
    ├── admin.html
    ├── imagens/
    │   ├── mcm-logo.png
    │   └── mcm-topo-original.png
    ├── css/
    │   └── admin.css
    ├── js/
    │   └── admin.js
    └── uploads/             # criada automaticamente ao enviar uma foto
```

## Executar

É necessário ter o Node.js instalado.

```bash
npm install
npm start
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

## Login administrativo

- Usuário: `admim`
- Senha: `tkd123`

Antes de publicar na internet, defina `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET` como variáveis de ambiente com valores seguros.

## Onde editar

- `index.html`: conteúdo e seções da página pública.
- `style.css`: visual e responsividade da página pública.
- `script.js`: notícias, busca e filtro.
- `public/admin.html`: painel administrativo.
- `public/css/admin.css` e `public/js/admin.js`: visual e comportamento do painel.
- `server.js`: API, login e upload de fotos.
- `data/posts.json`: notícias cadastradas.
