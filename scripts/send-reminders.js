const transport = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: { user: OUTLOOK_USER, pass: OUTLOOK_PASSWORD },
    tls: { ciphers: "SSLv3", rejectUnauthorized: false },
  });
