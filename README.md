# NEXORA E-commerce

NEXORA is a premium, futuristic technology showroom built with React and Vite in `client/`, plus a Node.js and Express API with MongoDB in `server/`. The user flow starts with registration, continues to sign in, and then opens the storefront.

## Requirements

- Node.js 20.12 or later and npm
- MongoDB Community Server running locally, or another MongoDB connection URI
- MongoDB Compass (optional, for viewing the database)

## Install dependencies and configure

From the project root, run:

```powershell
npm install --prefix client
npm install --prefix server
Copy-Item -LiteralPath server/.env.example -Destination server/.env
```

The local development URI is `mongodb://127.0.0.1:27017/nexora`. The server reads `MONGODB_URI`, `PORT`, and `JWT_SECRET` from `server/.env`. Replace the JWT secret placeholder with a private random value before signing in. Keep `.env` out of Git; it is ignored.

If you are already in `server`, the copy command is `Copy-Item -LiteralPath .env.example -Destination .env`. Do not overwrite an existing `.env` that already contains your private key.

## Start both apps

Open two terminals in the project root.

Terminal 1:

```powershell
npm run dev:server
```

Terminal 2:

```powershell
npm run dev:client
```

The backend can also be started from inside `server` using `npm run dev:server`. The frontend can be started inside `client` with `npm run dev`. Open the Vite URL, usually `http://localhost:5173`; Vite proxies `/api` requests to port 5000.

## Use the site

1. Create an account at the registration page using a name, email, and password with at least eight characters.
2. Sign in with that account.
3. Browse the catalog, open category menus, search, sort, save products, inspect product details, and add items to the shopping bag.

The catalog is a curated project demo. The bag is held in the current browser session. Checkout saves a real order document to MongoDB using cash on delivery; no card processor is connected. Product photographs are loaded from Unsplash, so they need an internet connection.

The homepage hero renders a real-time Three.js headphone scene through `@react-three/fiber`, with orbital rings, floating particles, pointer-driven rotation, and a lightweight CSS fallback for browsers without WebGL. The NW-01 design language — near-black surfaces, electric blue, cyan, and violet — is layered over the original storefront with `client/src/shop/store-noir.css` and `client/src/auth/auth-noir.css`. Scroll reveals, the search overlay, the product gallery, and the 3D card containers all respect `prefers-reduced-motion`.

## Check the API

With the server running, visit `http://localhost:5000/api/health` or run:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

The health route confirms the API process is responding. The server console separately reports MongoDB connection status.

## View MongoDB in Compass

Start MongoDB Community Server, then connect Compass to `mongodb://127.0.0.1:27017`. After registration, open the `nexora` database and its `users` collection. Passwords are stored as bcrypt hashes. Completed cash-on-delivery checkouts are saved in the `orders` collection. If you use a hosted database, put its URI in `server/.env` and use the same URI in Compass.
