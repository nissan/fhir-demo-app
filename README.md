This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Synthetic data

`utils/fhir-generators.ts` generates the demo data: three FHIR R4 (4.0.1) collection bundles. Each holds a provider
organisation with a department, two locations, four healthcare services and three practitioners, and five patients
with their encounters, conditions, vital signs, laboratory reports (with a PDF) and care teams.

- Generation is seeded (`DEFAULT_SEED`), so the server, the browser and every reload produce the same resource ids
  and a detail page can be linked to or reloaded. "Regenerate Fake Data" uses a random seed; those bundles, like
  bundles loaded from a server or pasted as JSON, live in memory until the page is reloaded.
- Codes come from the code systems the specification binds: SNOMED CT, LOINC, UCUM and the HL7 terminology. Vital
  signs follow the R4 vital signs profiles and conditions respect the con-3, con-4 and con-5 invariants.
- References are relative (`Patient/<id>`) and every `fullUrl` is `https://fhir-demo-app.vercel.app/fhir/<type>/<id>`,
  so they resolve inside the bundle. That base is a name, not a served FHIR endpoint.

## Checks

`pnpm check` type-checks, runs the generator tests in `tests/` and builds the app.

To validate the generated data against the specification, run the
[HL7 FHIR Validator](https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator) (Java 17 or later, network
access for terminology) over an exported bundle:

```bash
pnpm exec tsx -e "import { generateBundle } from './utils/fhir-generators'; console.log(JSON.stringify(generateBundle()))" > bundle.json
java -jar validator_cli.jar -version 4.0.1 bundle.json
```

## Deployment

Vercel builds `main` and serves it at https://fhir-demo-app.vercel.app. `engines.node` in `package.json` selects the
Node.js version for builds and functions and overrides the version in the Vercel project settings.
