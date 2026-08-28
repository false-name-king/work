interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const result = await context.env.DB.prepare(`
      SELECT memo FROM global_notes WHERE record_date = ?
    `).bind(date).first();

    return Response.json({ memo: result?.memo || '无' });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { date, memo } = await context.request.json<{ date: string, memo: string }>();
    if (!date) return Response.json({ error: 'Date is required' }, { status: 400 });

    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetMemo = memo || '无';

    // 使用 INSERT ON CONFLICT 语法来处理 upsert
    const { success } = await context.env.DB.prepare(`
      INSERT INTO global_notes (record_date, memo) 
      VALUES (?, ?)
      ON CONFLICT(record_date) DO UPDATE SET memo = excluded.memo
    `).bind(targetDate, targetMemo).run();

    return Response.json({ success });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};