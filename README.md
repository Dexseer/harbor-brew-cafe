# Harbor Brew Café — client-ready starter template

A responsive static café website for GitHub Pages. It includes an accessible mobile nav, menu rendered from `config.js`, configurable hours/address/contact links, Google Maps directions, SEO/social metadata, and an inquiry form.

## Important before using for a real café
This is still a **demo template**, not a verified real café. All business facts, sample prices, menu items, and imagery must be approved by the business owner before launch. Do not publish fake hours/address/contact information as real.

## Preview locally
Open `index.html` in a browser. For best results, use VS Code's Live Server extension (optional).

## Customize the business
Edit `config.js`:
- `name`, `tagline`
- `address` and `mapsQuery` (verified address or Google Maps place URL)
- `phone`, `email`, `messengerUrl`
- `hours` (set each day's time; use `Closed` for closed days)
- `menu` (name, description, price, Unsplash photo ID, optional tag)

Leave unconfirmed values blank. The directions, phone, and Messenger links remain hidden until configured.

## Contact form behavior
- If `formSubmitEmail` is blank, the form opens a prefilled email draft using `email`. The visitor's device must have an email app configured; this is not a server-side form.
- For a hosted form at no upfront cost, set `formSubmitEmail` to an inbox the owner controls. The site uses FormSubmit's AJAX endpoint. The owner must confirm the activation email on first use. FormSubmit is a third-party service; review its terms/privacy before use and test delivery before launch. Never put passwords or API secrets in this public repository.

## Publish on GitHub Pages
1. Extract this ZIP on your computer.
2. Open the existing GitHub repository's **Code** tab.
3. Click **Add file → Upload files**.
4. Upload/drag the files *inside* this folder (`index.html`, `style.css`, `script.js`, `config.js`, `README.md`) into the repository root. Do not upload only the ZIP or nested folder.
5. Commit the changes to `main`.
6. Keep **Settings → Pages → Deploy from a branch → main → /(root)** selected.
7. Wait for the Pages build in **Actions** to complete, then test the live URL on mobile and desktop.

## Launch checklist
- Owner approved name, menu, prices, hours, address, phone, email and social links
- All links tested on a phone
- Contact delivery tested end-to-end
- Images licensed/approved and alt text checked
- SEO title/description and social preview checked
- Privacy notice added if collecting personal information
