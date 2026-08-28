-- schema.sql

-- 1. 人员表 (基础信息)
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT DEFAULT '组员',
  machine INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 每日记录表 (动态数据)
CREATE TABLE IF NOT EXISTS daily_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  record_date TEXT NOT NULL, -- Format: "YYYY-MM-DD"
  attendance TEXT DEFAULT '出勤',
  work_status TEXT DEFAULT '[]', -- JSON array string
  batches INTEGER DEFAULT 20,
  pieces INTEGER DEFAULT 20,
  start_time TEXT DEFAULT '19:00',
  end_time TEXT DEFAULT '20:30',
  FOREIGN KEY (person_id) REFERENCES people(id),
  UNIQUE(person_id, record_date)
);

-- 3. 全局备注表
CREATE TABLE IF NOT EXISTS global_notes (
  record_date TEXT PRIMARY KEY,
  memo TEXT DEFAULT '无'
);

-- 插入一些默认数据以便测试
INSERT INTO people (name, role) VALUES ('郭书楠', '机长');
INSERT INTO people (name, role) VALUES ('严文雅', '组员');
INSERT INTO people (name, role) VALUES ('卢从庆', '组员');
INSERT INTO people (name, role) VALUES ('杜瑶瑶', '组员');
INSERT INTO people (name, role) VALUES ('章屹', '组员');