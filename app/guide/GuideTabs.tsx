"use client";

import { useState } from "react";

type Tab = "fan" | "creator" | "qna";

export default function GuideTabs({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [tab, setTab] = useState<Tab>("fan");

  return (
    <div className="max-w-lg mx-auto px-4 pt-0 pb-28">
      {/* タブ（固定） */}
      <div className="sticky top-9 z-30 -mx-4 px-4 py-3 mb-3" style={{ background: "linear-gradient(to bottom, rgba(253,244,251,0.97) 80%, transparent 100%)" }}>
        <div className="flex gap-2 max-w-lg mx-auto">
          {(["fan", "creator", "qna"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t ? "glass-btn-primary text-white" : "glass-btn-secondary text-slate-600"
              }`}
            >
              {t === "fan" ? "ファン" : t === "creator" ? "クリエイター" : "Q&A"}
            </button>
          ))}
        </div>
      </div>

      {tab === "fan" && <FanContent />}
      {tab === "creator" && <CreatorContent />}
      {tab === "qna" && <QnaContent />}

      {/* 未ログインユーザー向けCTAボタン */}
      {!isLoggedIn && (
        <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-lg mx-auto px-4 pointer-events-auto flex justify-center">
            <a
              href="/login"
              className="glass-btn-primary px-10 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center shadow-lg"
            >
              無料ではじめる
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 共通スタイル ─── */
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-slate-700 mt-6 mb-2 flex items-center gap-1.5">
      <span className="sparkle" />
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold text-slate-600 mt-4 mb-1.5">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-600 leading-relaxed mb-2">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 mb-3">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-slate-600 flex gap-2">
          <span className="text-[#B98AF5] flex-shrink-0">・</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="glass-card rounded-2xl px-5 py-4 mb-4">{children}</div>;
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
        >
          {step}
        </span>
        <p className="text-sm font-bold text-slate-700">{title}</p>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <code className="block bg-slate-100 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono my-2">
      {children}
    </code>
  );
}

/* ─── ファンタブ ─── */
function FanContent() {
  return (
    <div>
      <Card>
        <p className="text-sm font-bold brand-gradient-text mb-2">KIZALOとは？</p>
        <P>KIZALOは、推しのプロフィールページにファンが「名前を刻む」サービスです。</P>
        <P>毎日1回、推しのページで「名前を刻る」ボタンを押すことで、応援の記録がページに残ります。</P>
        <P>ただ見るだけではなく、ただリンクを踏むだけでもなく、「今日も応援しに来た」という証を残せます。</P>
      </Card>

      <H2>KIZALOでできること</H2>
      <Ul items={[
        "推しのページに名前を刻む",
        "1日1回、応援の記録を残す",
        "毎日続けて連続記録を伸ばす",
        "最速・最多・継続などのランキングに載る",
        "推しのSNSやリンクをまとめて見る",
      ]} />

      <H2>ファンとしての使い方</H2>

      <StepCard step={1} title="推しのKIZALOページを開く">
        <P>推しがSNSやプロフィールに貼っているKIZALOのURLを開きます。</P>
        <CodeBlock>kizalo.jp/推しのID</CodeBlock>
        <P>ページを開くと、プロフィール・SNSリンク・コンテンツ・刻んだファンの名前などを見られます。</P>
      </StepCard>

      <StepCard step={2} title="Googleアカウントでログインする">
        <P>名前を刻むには、Googleアカウントでログインします。ログインしていない状態でボタンを押すと、ログイン画面に進みます。</P>
      </StepCard>

      <StepCard step={3} title="「名前を刻る」ボタンを押す">
        <P>推しのページにある「名前を刻る」ボタンを押します。ボタンを押すと、その日の応援としてあなたの名前が記録されます。</P>
        <P>1日に刻めるのは、同じ推しに対して1回まで。すでに刻んでいる場合は「刻り済み」と表示されます。</P>
      </StepCard>

      <StepCard step={4} title="自分の名前が推しのページに残る">
        <P>刻ると、推しのページにあなたの名前が表示されます。ただのアクセスではなく、ただのいいねでもなく、推しのプロフィールに自分の名前が残ります。</P>
      </StepCard>

      <StepCard step={5} title="毎日続けて連続記録を伸ばす">
        <P>毎日続けて刻むことで「連続日数」が伸びていきます。毎日刻ることで、推しにも「ずっと見に来てくれているファン」として伝わりやすくなります。</P>
      </StepCard>

      <StepCard step={6} title="ランキングに載る">
        <P>KIZALOには、応援の記録が見えるランキングがあります。</P>
        <Ul items={[
          "最速：その日に早く刻んだファンが表示",
          "ランダム：その日刻んだ人の中からランダム表示",
          "歴代最多：たくさん刻っているファンが表示",
          "歴代継続：連続で刻っているファンが表示",
        ]} />
      </StepCard>

      <StepCard step={7} title="自分の刻み実績を見る">
        <P>ログインした状態で推しのページを見ると、自分の刻み実績を確認できます。</P>
        <Ul items={[
          "総合の刻み回数",
          "現在の連続日数",
          "最高連続日数",
          "今日刻んだかどうか",
          "明日刻ると何日連続になるか",
        ]} />
      </StepCard>
    </div>
  );
}

/* ─── クリエイタータブ ─── */
function CreatorContent() {
  return (
    <div>
      <Card>
        <p className="text-sm font-bold brand-gradient-text mb-2">こんな人におすすめ</p>
        <Ul items={[
          "地下アイドル・メンズアイドル",
          "個人VTuber・配信者・歌い手",
          "アーティスト・シンガーソングライター",
          "インフルエンサー・クリエイター",
          "ファンコミュニティを作りたい人",
        ]} />
      </Card>

      <H2>プロフィールの作り方</H2>

      <StepCard step={1} title="Googleアカウントでログインする">
        <P>KIZALOで自分のページを作るには、Googleアカウントでログインします。ログイン後、プロフィール作成画面に進みます。</P>
      </StepCard>

      <StepCard step={2} title="表示名を設定する">
        <P>KIZALO上で表示される名前を設定します。活動名・アイドル名・配信者名など、普段使っている名前を入れましょう。</P>
        <Ul items={["星野コハル", "朝比奈レン", "Mika", "KOHARU Official"]} />
      </StepCard>

      <StepCard step={3} title="プロフィールIDを設定する">
        <P>あなた専用ページのURLになります。SNSのIDと同じにするとファンが覚えやすくなります。</P>
        <CodeBlock>kizalo.jp/あなたのID</CodeBlock>
        <P>英数字・ハイフン・アンダースコア（3〜30文字）が使えます。</P>
      </StepCard>

      <StepCard step={4} title="利用規約に同意して作成">
        <P>利用規約とプライバシーポリシーを確認し、問題なければプロフィールを作成します。</P>
      </StepCard>

      <StepCard step={5} title="プロフィールを編集する">
        <P>編集ページから内容を整えます。まず「誰のページか」「どこを見てほしいか」がわかる状態にしましょう。</P>
      </StepCard>

      <H2>設定できる内容</H2>

      <Card>
        <H3>アイコン画像</H3>
        <P>SNSで使っているアイコンと同じにするとファンが迷いにくくなります。顔やキャラクターがはっきり見える画像がおすすめです。</P>

        <H3>自己紹介</H3>
        <P>何者なのか・何をしている人なのかを書きます。短くてもOKです。</P>
        <div className="bg-slate-50 rounded-xl px-3 py-2 mb-2 text-xs text-slate-600 leading-relaxed">
          地下アイドルとして活動中。ライブ情報・SNS・応援リンクをまとめています。毎日刻んでくれたら嬉しいです。
        </div>

        <H3>プロフリンク</H3>
        <P>自己紹介の下に1つリンクを置けます。ライブ予約・グッズ・ファンクラブなど、特に見てほしいページに使いましょう。</P>
        <Ul items={["ライブ予約はこちら", "グッズはこちら", "最新動画を見る", "ファンクラブに入る"]} />
      </Card>

      <H2>SNSリンク</H2>
      <Card>
        <P>X・Instagram・TikTok・YouTube・Twitch・SHOWROOM・17LIVE・Pococha・note・Threads・BOOTH・lit.link・公式サイトなどをまとめられます。</P>
        <P>ファンに一番見てほしい場所を上に置きましょう。</P>
      </Card>

      <H2>コンテンツブロック</H2>

      <Card>
        <H3>テキスト</H3>
        <P>お知らせ・活動予定・ファンへのメッセージなどを文章で載せられます。</P>

        <H3>画像</H3>
        <P>宣材写真・ライブ告知・グッズ画像など、視覚的に目立たせたい情報に使います。</P>

        <H3>YouTube</H3>
        <P>最新MV・自己紹介動画・ライブ映像などを埋め込みで表示できます。初めて来たファンに見てほしい動画を置くのがおすすめです。</P>

        <H3>Apple Music / Spotify</H3>
        <P>楽曲・アルバム・プレイリストを埋め込みで表示できます。音楽活動をしている人はSNSから楽曲まで自然につなげられます。</P>

        <H3>TimeTree</H3>
        <P>ライブ予定・配信予定・イベントカレンダーなどの予定をまとめて見せられます。</P>

        <H3>ランキング</H3>
        <P>ファンの刻み記録（最速・ランダム・歴代最多・歴代継続）を表示するブロックです。ファンが「自分の名前が載る」「連続記録を伸ばせる」楽しみになります。</P>
      </Card>

      <H2>ページURLをシェアする</H2>
      <Card>
        <CodeBlock>kizalo.jp/あなたのID</CodeBlock>
        <P>おすすめの貼り場所：Xのプロフィール・Instagramプロフィール・TikTok・YouTube概要欄・配信概要欄・lit.link・固定ポスト</P>
        <P>ひとこと添えると刻ってもらいやすくなります。</P>
        <div className="bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-600 leading-relaxed">
          毎日1回、名前を刻めます。応援の証を残してくれたら嬉しいです。
        </div>
      </Card>

      <H2>ファンに刻ってもらうコツ</H2>

      <Card>
        <H3>1. 最初にやることを1つだけ伝える</H3>
        <P>「KIZALO見てね」だけでなく「名前を刻ってね」と具体的に伝えましょう。</P>

        <H3>2. 毎日続ける意味を伝える</H3>
        <div className="bg-slate-50 rounded-xl px-3 py-2 mb-2 text-xs text-slate-600">
          毎日刻ると連続記録が伸びます。誰が一番続けてくれるか見てます。
        </div>

        <H3>3. ランキングを案内する</H3>
        <div className="bg-slate-50 rounded-xl px-3 py-2 mb-2 text-xs text-slate-600">
          最速で刻ってくれた人、ページに表示されます。今日の一番乗り待ってます。
        </div>

        <H3>4. 繰り返し案内する</H3>
        <P>朝・夜・ライブ前後・配信前後・新しい告知を出した日などに繰り返し案内しましょう。</P>
      </Card>

      <H2>最初にやるおすすめ設定</H2>
      <Ul items={[
        "アイコン画像",
        "表示名",
        "自己紹介",
        "一番見てほしいリンク",
        "SNSリンク",
      ]} />
      <P>余裕があればコンテンツブロック（YouTube・画像・ライブ予定・ランキング）も追加しましょう。</P>
    </div>
  );
}

/* ─── Q&A タブ ─── */
function QnaContent() {
  const faqs = [
    {
      q: "KIZALOは何をするサービスですか？",
      a: "推しのプロフィールページに、ファンが自分の名前を刻めるサービスです。毎日1回ボタンを押すことで、応援の記録が残ります。",
    },
    {
      q: "名前を刻るとは何ですか？",
      a: "推しのページに「今日応援しに来た」という証を残すことです。ボタンを押すと、自分の名前や記録が推しのページに表示されます。",
    },
    {
      q: "1日に何回刻めますか？",
      a: "同じ推しに対して、1日1回まで刻めます。すでに刻った日は「刻り済み」になります。",
    },
    {
      q: "毎日刻るとどうなりますか？",
      a: "連続日数が伸びます。毎日続けることで、継続して応援していることが記録されます。",
    },
    {
      q: "ログインしないと使えませんか？",
      a: "推しのページを見ることはできます。ただし、名前を刻るにはログインが必要です。",
    },
    {
      q: "推し側は何が見えますか？",
      a: "誰が刻ってくれたか、何回刻ってくれたか、何日連続で来てくれているかなどを確認できます。",
    },
    {
      q: "SNSリンクは設定できますか？",
      a: "設定できます。X・Instagram・TikTok・YouTube・Twitch・SHOWROOM・17LIVE・Pococha・note・Threads・BOOTH・lit.link・公式サイトなどをまとめられます。",
    },
    {
      q: "音楽や動画も載せられますか？",
      a: "載せられます。YouTube・Apple Music・Spotifyなどをプロフィールに表示できます。",
    },
    {
      q: "ライブ予定やイベント予定は載せられますか？",
      a: "TimeTreeを使って予定を載せることができます。ライブ予定・配信予定・出演予定などをまとめたいときに便利です。",
    },
    {
      q: "プロフィールIDはあとから変えられますか？",
      a: "編集ページからプロフィールIDを変更できます。ただし、IDを変えるとURLも変わるため、SNSなどに貼っているリンクも更新する必要があります。",
    },
    {
      q: "どんな人に向いていますか？",
      a: "地下アイドル・個人VTuber・配信者・歌い手・アーティスト・インフルエンサーなど、ファンとの接点を増やしたい人に向いています。",
    },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <FaqItem key={i} q={faq.q} a={faq.a} />
      ))}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
        >
          Q
        </span>
        <span className="flex-1 text-xs font-semibold text-slate-700">{q}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-slate-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="flex gap-3 pt-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #B98AF5 0%, #7DB7FF 100%)" }}
            >
              A
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{a}</p>
          </div>
        </div>
      )}
    </div>
  );
}
