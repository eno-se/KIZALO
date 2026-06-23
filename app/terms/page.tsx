import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/me" className="text-slate-400 hover:text-slate-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">利用規約</h1>
      </div>
      <div className="glass-card rounded-2xl p-6 text-sm text-slate-600 space-y-6">
        <p>本利用規約（以下「本規約」といいます。）は、KIZALO運営者（以下「運営者」といいます。）が提供するWebサービス「KIZALO」（以下「本サービス」といいます。）の利用条件を定めるものです。本サービスを利用するユーザーは、本規約に同意したものとみなします。</p>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第1条（サービスについて）</h2>
          <p>本サービスは、ファンがクリエイター、配信者、活動者、その他応援したい人物等のプロフィールページに、応援の意思表示として名前を刻むことができるWebサービスです。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第2条（利用登録）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>本サービスの一部機能を利用するには、Googleアカウントによるログインが必要です。</li>
            <li>ユーザーは、ログインまたは本サービスの利用を開始した時点で、本規約に同意したものとみなされます。</li>
            <li>ユーザーは、登録情報について、正確かつ最新の情報を提供するものとします。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第3条（ユーザー情報・投稿内容）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>ユーザーは、本サービス上で表示名、プロフィール画像、一言、SNSリンク、その他の情報を登録できます。</li>
            <li>ユーザーは、自ら登録・投稿する情報について、必要な権利を有しているものとします。</li>
            <li>ユーザーが本サービス上で登録した表示名、プロフィール画像、刻り記録、ランキング情報等は、本サービス内で他のユーザーに表示される場合があります。</li>
            <li>運営者は、ユーザーが登録した情報が本規約に違反すると判断した場合、事前の通知なく削除、非表示、利用制限等の対応を行うことがあります。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第4条（禁止事項）</h2>
          <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>他者へのなりすまし行為</li>
            <li>他者の権利、名誉、信用、プライバシーを侵害する行為</li>
            <li>誹謗中傷、脅迫、嫌がらせ、差別的表現を含む行為</li>
            <li>公序良俗に反する行為</li>
            <li>性的、暴力的、過度に不快な表現を投稿する行為</li>
            <li>不正アクセス、自動化ツール、bot等を用いた不正操作</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>法令または本規約に違反する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第5条（サービスの変更・停止・終了）</h2>
          <p>運営者は、ユーザーへの事前通知なく、本サービスの内容変更、機能追加、機能制限、一時停止、終了を行うことがあります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第6条（アカウントの停止・削除）</h2>
          <p>運営者は、ユーザーが本規約に違反した場合、または運営者が必要と判断した場合、事前の通知なく、アカウントの停止、投稿内容の削除、利用制限等の対応を行うことがあります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第7条（知的財産権）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>本サービスに関するプログラム、デザイン、ロゴ、名称、その他一切の知的財産権は、運営者または正当な権利者に帰属します。</li>
            <li>ユーザーが本サービス上に登録した画像、表示名、文章等の権利は、当該ユーザーまたは正当な権利者に帰属します。</li>
            <li>ユーザーは、運営者が本サービスの提供、表示、運営、改善、告知のために、ユーザーが登録した情報を必要な範囲で利用することを許諾します。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第8条（免責事項）</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>運営者は、本サービスがユーザーの特定の目的に適合すること、継続的に利用できること、不具合が発生しないことを保証しません。</li>
            <li>本サービスの利用によりユーザーまたは第三者に損害が生じた場合でも、運営者に故意または重過失がある場合を除き、運営者は責任を負いません。</li>
            <li>ユーザー間、またはユーザーと第三者との間で発生したトラブルについて、運営者は責任を負いません。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第9条（規約の変更）</h2>
          <p>運営者は、必要に応じて本規約を変更できるものとします。変更後の規約は、本サービス上に掲載した時点で効力を生じるものとし、変更後にユーザーが本サービスを利用した場合、変更後の規約に同意したものとみなします。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第10条（お問い合わせ）</h2>
          <p>本サービスに関するお問い合わせは、本サービス内のお問い合わせフォームまたは運営者が指定する方法により行うものとします。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">第11条（準拠法・管轄）</h2>
          <p>本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>
      </div>
    </div>
  );
}
