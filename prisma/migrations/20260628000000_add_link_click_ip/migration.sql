-- 既存レコードの重複を除去してからユニーク制約を追加
-- ip カラムを追加（既存レコードは空文字列）
ALTER TABLE "LinkClick" ADD COLUMN "ip" TEXT NOT NULL DEFAULT '';

-- 重複する (ip, linkId, date) のうち最新以外を削除
DELETE FROM "LinkClick"
WHERE id NOT IN (
  SELECT DISTINCT ON (ip, "linkId", date) id
  FROM "LinkClick"
  ORDER BY ip, "linkId", date, "createdAt" DESC
);

-- ユニーク制約を追加
CREATE UNIQUE INDEX "LinkClick_ip_linkId_date_key" ON "LinkClick"(ip, "linkId", date);
