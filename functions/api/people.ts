interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const now = new Date();
  const defaultDate = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  const date = url.searchParams.get('date') || defaultDate;

  try {
    const { results } = await context.env.DB.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.role, 
        p.machine,
        COALESCE(r.attendance, '出勤') as attendance,
        COALESCE(r.work_status, '[]') as workStatus,
        COALESCE(r.batches, 20) as batches,
        COALESCE(r.pieces, 20) as pieces,
        COALESCE(r.start_time, '19:00') as startTime,
        COALESCE(r.end_time, '20:30') as endTime
      FROM people p
      LEFT JOIN daily_records r ON p.id = r.person_id AND r.record_date = ?
    `).bind(date).all();

    const formattedResults = results.map(row => ({
      ...row,
      workStatus: typeof row.workStatus === 'string' ? JSON.parse(row.workStatus) : []
    }));

    return Response.json(formattedResults);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { name } = await context.request.json<{ name: string }>();
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

    const { success } = await context.env.DB.prepare(
      `INSERT INTO people (name) VALUES (?)`
    ).bind(name).run();

    return Response.json({ success });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};