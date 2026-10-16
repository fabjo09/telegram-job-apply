# Telegram Job Apply

This small local service monitors one Telegram group and creates an application email with your CV attached for every new message that contains an email address.

It starts in **review-only mode**. Matching posts are written as human-readable JSON drafts to `queue/`; no email leaves your account. After you have checked the results, set `AUTO_SEND=true` to enable direct sending.

## What it does

- Watches one group/channel from your own Telegram account.
- Extracts every email address in a new message; no role, salary, experience, location, or keyword filter is applied.
- Uses a detected job title when available, otherwise uses the generic title “Software Developer”.
- Attaches the CV file you specify.
- Prevents duplicate job/recipient applications.
- Optionally limits automatic sending per UTC day; set `APPLICATION_LIMIT_PER_DAY=0` for no cap.
- Keeps the Telegram login session and email password out of Git.

The two messages you supplied are covered by the included parser tests: it finds `marktomake24@gmail.com` for the Full Stack post and `abhishek.pandey@hipathtech.com` for the React post.

## Set up

1. Install Node.js 20 or later, then run `npm install` in this folder.
2. Copy `.env.example` to `.env` and fill in the candidate details, keyword filters, and CV path. SMTP mail details are only required once you choose automatic sending.
3. Obtain `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` under **API development tools** at [my.telegram.org](https://my.telegram.org). Telegram requires these for an account-level client. [Official Telegram guide](https://core.telegram.org/api/obtaining_api_id)
4. Run `npm run login`, complete the Telegram sign-in, and paste the printed session string into `TELEGRAM_SESSION` in `.env`. Treat that value like a password.
5. Run `npm run chats` to list the groups and channels belonging to that Telegram account. Copy the `TELEGRAM_GROUP=...` value shown for the desired job group into `.env`.
6. Keep `AUTO_SEND=false`, start the service with `npm start`, then post/forward a test job into the selected group. Check the saved draft under `queue/`.
7. Only when the filters and email text are correct, change `AUTO_SEND=true` and restart the service.

For Gmail SMTP, enable two-step verification and create a dedicated App Password; normal Gmail passwords are not supported for this setup. [Google’s App Password guide](https://support.google.com/mail/answer/185833)

## Run continuously

Run `npm start` on a computer or server that stays online. On Windows, the next practical step is to add it to Task Scheduler after testing it in review mode.

## Personalisation

Set `CANDIDATE_HIGHLIGHTS` in `.env` to a short, truthful skills summary. For React, Angular, Node.js, .NET/C#, back-end, front-end, and full-stack roles, the email chooses a matching evidence-based summary; it falls back to your configured highlights for other roles. Edit `src/email.ts` if you want a different email template. Keep your CV filename/path current in `.env`.

## Verify without credentials

Run `npm test` to verify parsing against the supplied examples, and `npm run check` to type-check the project.

## Important notes

Telegram’s official documentation warns that client API accounts are monitored for abusive automation. This service only reads a single group you already belong to, and it does not send Telegram messages. Keep application email filters strict and only enable auto-send for roles you genuinely want to apply for.
