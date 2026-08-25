import nodemailer from 'nodemailer';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: 'hoas-backend/.env' });

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
console.log('SMTP_HOST:', process.env.SMTP_HOST || '(default smtp.gmail.com)');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '(default 587)');
console.log('SMTP_USER set:', !!user, user ? `(${user.slice(0, 3)}***)` : '');
console.log('SMTP_PASSWORD set:', !!pass, pass ? `(length ${pass.length})` : '');

if (!user || !pass) {
    console.log('RESULT: Email DISABLED — transporter never created.');
    process.exit(0);
}

const port = Number(process.env.SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
});

try {
    await transporter.verify();
    console.log('RESULT: SMTP connection + auth OK ✔');
    const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'HOAS System'}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: user,
        subject: 'HOAS SMTP Test',
        text: 'If you received this, email sending works.',
    });
    console.log('RESULT: Test email sent ✔ MessageId:', info.messageId);
} catch (err) {
    console.log('RESULT: FAILED ✘');
    console.log('Code:', err.code);
    console.log('Response:', err.response);
    console.log('Message:', err.message);
}
