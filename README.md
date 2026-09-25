# ELO (evoluído do Editor OS)

**ELO — Seu espaço para criar, organizar e acompanhar projetos.**

## Como rodar

Abra `index.html` num servidor estático (ex.: extensão "Live Server" do VS Code,
`npx serve`, ou publicando no Firebase Hosting). Não abra o arquivo direto pelo
`file://`, porque o Firebase Auth/Storage não funciona bem nesse modo.

## Antes de usar

1. **Ative o Cloud Firestore** no console do Firebase (se ainda não estiver ativo).
2. **Ative o Firebase Storage** no console (aba "Storage" → "Vamos começar"),
   já que a imagem de capa dos projetos e a aba "Arquivos" usam o Storage.
   Se o Storage não estiver ativado, o upload de arquivos vai falhar (a imagem
   de capa cai automaticamente para um fallback em base64, mas os arquivos da
   aba "Arquivos" dependem do Storage).
3. **Publique as regras de segurança**: copie o conteúdo de `firestore.rules`
   para as regras do Firestore, e o de `storage.rules` para as regras do
   Storage, no console do Firebase. Sem isso, por padrão o Firestore/Storage
   podem estar bloqueando tudo (ou, pior, liberados para qualquer pessoa).

## Estrutura de arquivos

```
index.html          Estrutura HTML (tela de login, desktop, workspace do projeto, modais)
style.css            Estilos (tema escuro, evoluído da paleta original do Editor OS)
                     (marca "ELO" aplicada na tela de login e na barra superior)
firebase-config.js   Config do Firebase (inalterado)
auth.js              Login, cadastro, logout, estado de autenticação
utils.js             Helpers (datas, formatação, toasts, modais, tags)
db.js                Camada de dados: todo o acesso ao Firestore e Storage
app.js               Controlador principal: estado global e navegação
desktop.js           Tela inicial: grade de projetos, filtros, modal de novo projeto, categorias
project.js           Workspace do projeto: as 7 abas (visão geral, anotações, tarefas, etc.)
firestore.rules      Regras de segurança do Firestore (copiar para o console)
storage.rules        Regras de segurança do Storage (copiar para o console)
```

## Estrutura de dados no Firestore

```
users/{uid}
  ├── categories/{categoryId}     { name, icon, createdAt }
  └── projects/{projectId}        { name, description, categoryId, image, imagePath,
                                     status, priority, startDate, dueDate, tags,
                                     archived, progress, tasksTotal, tasksDone,
                                     notesCount, resourcesCount, filesCount,
                                     lastActivityAt, lastActivityText,
                                     createdAt, updatedAt }
       ├── tasks/{taskId}         { title, description, status, priority, dueDate,
                                     createdAt, completedAt }
       ├── notes/{noteId}         { title, content, createdAt, updatedAt }
       ├── resources/{resourceId} { name, description, url, createdAt }
       ├── files/{fileId}         { name, url, path, size, type, createdAt }
       ├── journal/{entryId}      { content, date, createdAt }
       └── activity/{activityId}  { type, message, createdAt }
```

Tudo fica sob `users/{uid}`, então um usuário nunca acessa dados de outro
(garantido pelas regras em `firestore.rules` / `storage.rules`).

`progress`, `tasksTotal`, `tasksDone`, `notesCount`, `resourcesCount` e
`filesCount` são campos "cache" recalculados automaticamente no projeto
sempre que uma tarefa/anotação/recurso/arquivo é criado ou removido — assim
a tela inicial mostra o progresso de todos os projetos sem precisar carregar
as tarefas de cada um.
