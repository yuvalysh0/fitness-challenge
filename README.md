# 75 Hard

75 Hard mental toughness challenge tracker – Angular 21, Material, Tailwind. Data can be stored locally (localStorage) or synced to **Supabase** when you sign in.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
3. **Do not put real keys in the committed env files.** Instead, use a local file (gitignored):
   - Copy `src/environments/environment.example.ts` to `src/environments/environment.development.local.ts`
   - Fill in `supabaseUrl` and `supabaseAnonKey`
   - Run the app with: `ng serve -c development-local`
4. In the Supabase **SQL Editor**, run the migrations in `supabase/migrations/` to create tables and RLS.
5. (Optional) In **Storage**, create a bucket `progress-photos` for daily progress photos; add RLS so users can only access their own folder.

For production builds, inject real values via CI (e.g. replace `environment.ts` or set at build time); the repo only contains placeholder env files.

When signed in, the app syncs challenge data (start date, day logs, measurements, habits) to Supabase. When signed out, it uses localStorage only.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
