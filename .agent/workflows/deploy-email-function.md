---
description: Deploy the Supabase Edge Function for sending emails
---

This workflow deploys the `send-email` Edge Function to your Supabase project. This is required to fix the CORS error when sending emails.

1.  **Login to Supabase CLI** (if not already logged in):
    ```bash
    npx supabase login
    ```

2.  **Link your project**:
    Replace `your-project-ref` with your actual project ID (e.g., `spumhlickqzdhsdarkcc`).
    ```bash
    npx supabase link --project-ref spumhlickqzdhsdarkcc
    ```

3.  **Set Secrets**:
    You need to set the `RESEND_API_KEY` and `RESEND_FROM_EMAIL` secrets in your Supabase project.
    ```bash
    npx supabase secrets set RESEND_API_KEY=your_resend_api_key
    npx supabase secrets set RESEND_FROM_EMAIL=your_from_email
    ```
    *Note: You can find these values in your `.env` file.*

4.  **Deploy the Function**:
    ```bash
    npx supabase functions deploy send-email
    ```

5.  **Verify**:
    Try sending an email from the application again.
