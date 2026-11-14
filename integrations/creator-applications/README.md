# Creator applications in Google Sheets

1. Create a private Google Sheet with an empty tab named `Applications`. Share the Sheet only with the team members reviewing submissions. Copy the spreadsheet ID from the part of the Sheet URL between `/d/` and `/edit`.
2. Open **Extensions → Apps Script** from the Sheet, replace the editor's starter code with [Code.gs](./Code.gs), and save. In **Project Settings → Script properties**, set `CREATOR_APPLICATION_SPREADSHEET_ID` to the ID and `CREATOR_APPLICATION_SECRET` to a random secret. Generate one with `openssl rand -hex 32`.
3. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me**, and **Who has access** to **Anyone** so the server can call it without a Google session. Authorize Sheets access as the deployment owner. Copy the deployed URL ending in `/exec`. [Google Apps Script deployment guide](https://developers.google.com/apps-script/guides/web)
4. Set `CREATOR_APPLICATION_SCRIPT_URL` to that URL and `CREATOR_APPLICATION_SECRET` to the same secret in the website's server environment. Use the intended Vercel environment and redeploy after changes. Keep both variables server-side.
5. Submit a synthetic application through the site and confirm an acknowledgement and one new row. If retesting directly against the receiver, replay the same submission ID and confirm the response remains successful and the row count stays the same. Remove the synthetic row afterwards.

The receiver puts the UTC timestamp and submission ID first, followed by the seven application fields. It writes headers with the first row only when the tab is empty. Keep the header row and the submission ID column in place. Use a separate tab for any rearranged views or summaries.

The response body is JSON. The site treats `{"ok":true}` as an acknowledgement of a durable write or a replay of an existing submission ID. An `ok:false` response carries a generic error code. If troubleshooting, check the deployment's permissions and server variables, or inspect the private Sheet directly for a matching ID. [Google Apps Script Content Service](https://developers.google.com/apps-script/guides/content)

When updating the receiver, edit the existing deployment and select a new version so the `/exec` URL stays stable. Rotate the secret by updating both Script Properties and the website's server environment, then redeploying the site.
