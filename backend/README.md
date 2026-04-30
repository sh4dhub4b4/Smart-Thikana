# Bashabari — Self-Hosted Backend

This folder contains everything you need to run the backend of the
Bashabari house-rental app **on your own machine or VPS**, fully
independent from Lovable Cloud.

It uses the official **self-hosted Supabase Docker stack** (Postgres +
GoTrue auth + PostgREST API + Realtime + Storage + Studio UI), and
applies the exact same schema, RLS policies, triggers and enums that
the production app uses.

```
backend/
├── README.md              ← you are here
├── .env.example           ← copy to .env and fill in
├── docker-compose.yml     ← thin wrapper around official Supabase stack
├── volumes/
│   └── db/
│       ├── 01-schema.sql  ← tables, enums, RLS, triggers (heavily commented)
│       └── 02-seed.sql    ← optional sample data
└── scripts/
    ├── reset.sh           ← wipes volumes & restarts clean
    └── migrate.sh         ← re-applies schema to a running DB
```

See `../SETUP.md` in the project root for the full install + deploy guide.
