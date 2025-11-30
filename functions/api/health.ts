interface Env {
  DATABASE_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hasDatabase = !!context.env.DATABASE_URL;
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: hasDatabase ? "configured" : "not configured",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
