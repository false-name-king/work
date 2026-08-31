interface Env {
  DB: D1Database;
}

interface UpdatePersonPayload {
  date?: string;
  role?: string;
  machine?: number | null;
  attendance?: string;
  workStatus?: string[];
  batches?: number;
  pieces?: number;
  startTime?: string;
  endTime?: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(Number(id))) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = (await context.request.json()) as UpdatePersonPayload;
    const { date, role, machine, attendance, workStatus, batches, pieces, startTime, endTime } = data;
    const now = new Date();
    const targetDate = date || `${now.getMonth() + 1} 月 ${now.getDate()} 日`;

    // 1. 更新 people 表的固定信息 (role, machine)
    const updatePeopleQueries: string[] = [];
    const peopleParams: (string | number | null)[] = [];
    if (role !== undefined) {
      updatePeopleQueries.push("role = ?");
      peopleParams.push(role);
    }
    if (machine !== undefined) {
      updatePeopleQueries.push("machine = ?");
      peopleParams.push(machine);
    }
    
    if (updatePeopleQueries.length > 0) {
      await context.env.DB.prepare(`
        UPDATE people SET ${updatePeopleQueries.join(', ')} WHERE id = ?
      `).bind(...peopleParams, id).run();
    }

    // 2. 更新或插入 daily_records 表的动态信息
    if (attendance !== undefined || workStatus !== undefined || batches !== undefined || pieces !== undefined || startTime !== undefined || endTime !== undefined) {
      
      const existingRecord = await context.env.DB.prepare(
        `SELECT id FROM daily_records WHERE person_id = ? AND record_date = ?`
      ).bind(id, targetDate).first<{ id: number }>();

      if (existingRecord) {
        const updateRecordQueries: string[] = [];
        const recordParams: (string | number)[] = [];
        if (attendance !== undefined) { updateRecordQueries.push("attendance = ?"); recordParams.push(attendance); }
        if (workStatus !== undefined) { updateRecordQueries.push("work_status = ?"); recordParams.push(JSON.stringify(workStatus)); }
        if (batches !== undefined) { updateRecordQueries.push("batches = ?"); recordParams.push(batches); }
        if (pieces !== undefined) { updateRecordQueries.push("pieces = ?"); recordParams.push(pieces); }
        if (startTime !== undefined) { updateRecordQueries.push("start_time = ?"); recordParams.push(startTime); }
        if (endTime !== undefined) { updateRecordQueries.push("end_time = ?"); recordParams.push(endTime); }
        
        await context.env.DB.prepare(`
          UPDATE daily_records SET ${updateRecordQueries.join(', ')} WHERE person_id = ? AND record_date = ?
        `).bind(...recordParams, id, targetDate).run();

      } else {
        await context.env.DB.prepare(`
          INSERT INTO daily_records (person_id, record_date, attendance, work_status, batches, pieces, start_time, end_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, 
          targetDate,
          attendance ?? '出勤',
          workStatus ? JSON.stringify(workStatus) : '[]',
          batches ?? 20,
          pieces ?? 20,
          startTime ?? '19:00',
          endTime ?? '20:30'
        ).run();
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(Number(id))) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 首先删除相关的每日记录
    await context.env.DB.prepare(
      `DELETE FROM daily_records WHERE person_id = ?`
    ).bind(id).run();

    // 然后删除人员
    const { success } = await context.env.DB.prepare(
      `DELETE FROM people WHERE id = ?`
    ).bind(id).run();

    return Response.json({ success });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};
