interface Env {
  DB: D1Database;
}

interface MemoRow {
  memo: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const now = new Date();
  const defaultDate = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  const date = url.searchParams.get('date') || defaultDate;

  try {
    const result = await context.env.DB.prepare(`
      SELECT memo FROM global_notes WHERE record_date = ?
    `).bind(date).first<MemoRow>();

    return Response.json({ memo: result?.memo || '无' });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { date?: string; memo?: string };
    const date = body?.date;
    const memo = body?.memo;

    const now = new Date();
    const targetDate = date || `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    const targetMemo = memo ?? '无';

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
