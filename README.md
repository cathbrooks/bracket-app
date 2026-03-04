# Bracket App

Tournament bracket management for organizers and spectators. Create tournaments, manage teams and matches, view live brackets with real-time updates.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Supabase** (PostgreSQL, Auth, Realtime)
- **Tailwind CSS** · **shadcn/ui**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run gen:types` | Generate TypeScript types from Supabase schema |

## Project Structure

```
app/          # Routes and layouts
components/   # React components (shadcn/ui in ui/)
lib/          # Supabase clients, config, utilities
supabase/     # Migrations and local config
```

## Documentation

See the [docs](./docs) folder for detailed documentation:

- [Architecture & Overview](./docs/README.md)
- [Database Schema](./docs/DATABASE.md)
- [Backend Infrastructure](./docs/BACKEND.md)
- [Frontend Infrastructure](./docs/FRONTEND.md)

## License

Private
