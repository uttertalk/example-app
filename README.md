<img src="https://raw.githubusercontent.com/uttertalk/brand/main/cover.png" alt="Utter: your users ask, your app changes">

# Example app

Northwind CRM, a small sales CRM with [Utter](https://www.utter.talk) built in. It's a complete example of adding
Utter to a product with [utter-sdk](https://github.com/uttertalk/sdk).

It has leads, deals and contacts for two sample companies (Greenfield Solar and Bluepeak Software), and the Utter
button in the corner of every signed-in screen. Ask it things like "which of my leads have gone quiet for a month?" or
"assign every unassigned lead to me". Questions are answered right away; changes are listed and wait for a yes. People
can also change how the app looks, just for themselves: "make it dark" or "hide the Source column".

## Where to look

| file | what it shows |
|---|---|
| [`src/lib/utter-host.ts`](src/lib/utter-host.ts) | The action list: the CRM's data types, the six reading actions and two actions that change data, and the functions that run them for one company and one person. |
| [`src/lib/utter.ts`](src/lib/utter.ts) | `createUtter` with the actions, `isMember` and `getViewer` (the CRM's own login). |
| [`src/app/api/utter/[...path]/route.ts`](src/app/api/utter/%5B...path%5D/route.ts) | The one route Utter and the browser call. |
| [`src/app/(crm)/utter-button.tsx`](src/app/(crm)/utter-button.tsx) | `<Utter />` with example requests, and refreshing the page on `utter:changed`. |
| [`src/app/(crm)/layout.tsx`](src/app/(crm)/layout.tsx) | Where the button goes: once, in the signed-in layout. |

## Deploy it in one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Futtertalk%2Fexample-app&project-name=utter-example-app&repository-name=utter-example-app&env=UTTER_PROJECT,UTTER_SECRET,DATABASE_URL&envDescription=Your%20Utter%20project%20id%20and%20secret%20%28from%20app.utter.talk%29%2C%20and%20a%20Postgres%20connection%20string%20%28a%20free%20one%20from%20neon.tech%20works%29.&envLink=https%3A%2F%2Fgithub.com%2Futtertalk%2Fexample-app%23deploy-it-in-one-click)

You'll be asked for three settings:

- `UTTER_PROJECT` and `UTTER_SECRET`: [create an Utter project](https://app.utter.talk/signup) first, with any address
  for now. Then put the address Vercel gives you in the project's Settings in the dashboard.
- `DATABASE_URL`: a Postgres connection string. A free one from [Neon](https://neon.tech) works. The two sample
  companies are filled in on first start.

Then, in your [dashboard](https://app.utter.talk/dashboard), add your own Claude or Gemini key under AI and switch
Utter on. Sign in to your copy as `sarah@greenfield.demo` with password `demo` and press the button in the corner.

## Run your own copy

Utter calls your app from its own servers, so the app needs a public address: deploy it (Vercel works out of the box)
or put it behind a tunnel like `ngrok http 3002`.

1. Clone this repo and install:

   ```bash
   npm install
   ```

2. [Create an Utter project](https://app.utter.talk/signup) with your app's public address.
3. Copy `.env.example` to `.env.local` and fill in your project id and secret.
4. Start it:

   ```bash
   npm run dev      # http://localhost:3002
   ```

   Without `DATABASE_URL`, data is kept in a local embedded Postgres in `.data/` and the two sample companies are filled
   in on first start. On a host like Vercel, set `DATABASE_URL` to a Postgres database.

5. In your [dashboard](https://app.utter.talk/dashboard), add your own Claude or Gemini key under AI and switch Utter
   on. Then sign in as `sarah@greenfield.demo` with
   password `demo` and press the button in the corner.

Other sample people: `tom@greenfield.demo` (Greenfield Solar) and `priya@bluepeak.demo` (Bluepeak Software), same
password. Each only ever sees and changes their own company's data.

## License

[MIT](LICENSE)
