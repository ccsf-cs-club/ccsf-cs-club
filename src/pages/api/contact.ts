import postgres from 'postgres';
import type { APIRoute } from 'astro';

const sql = postgres(import.meta.env.DATABASE_URL, { ssl: 'require' });

export const post: APIRoute = async ({ request }) => {
  try {
    const { name, email, message } = await request.json();

    await sql`
      INSERT INTO contacts (name, email, message)
      VALUES (${name}, ${email}, ${message})
    `;

    return new Response(JSON.stringify({ message: 'Message sent successfully!' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Failed to send message.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
