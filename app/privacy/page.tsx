import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/me" className="text-slate-400 hover:text-slate-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">プライバシーポリシー</h1>
      </div>
      <div className="glass-card rounded-2xl p-6 text-sm text-slate-600 space-y-6">
        <p>KIZALO運営者（以下「運営者」といいます。）は、Webサービス「KIZALO」（以下「本サービス」といいます。）におけるユーザー情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。</p>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">1. 取得する情報</h2>
          <p className="mb-2">本サービスでは、以下の情報を取得する場合があります。</p>

          <p className="font-semibold text-slate-700 mt-3 mb-1">① Googleアカウントによるログイン時に取得する情報</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>名前</li>
            <li>メールアドレス</li>
            <li>プロフィール画像（取得しますが、本サービス内での表示には使用しません）</li>
            <li>Googleアカウント識別子</li>
          </ul>

          <p className="font-semibold text-slate-700 mt-3 mb-1">② ユーザーが本サービス内で登録する情報</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>表示名</li>
            <li>プロフィール画像</li>
            <li>一言</li>
            <li>SNSリンク</li>
            <li>その他プロフィールに関する情報</li>
          </ul>

          <p className="font-semibold text-slate-700 mt-3 mb-1">③ 本サービスの利用に伴い取得する情報</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>刻り記録</li>
            <li>フォロー情報</li>
            <li>連続日数</li>
            <li>総刻り数</li>
            <li>ランキング情報</li>
            <li>リンククリック情報</li>
            <li>アクセス日時</li>
            <li>端末情報、ブラウザ情報等</li>
          </ul>

          <p className="font-semibold text-slate-700 mt-3 mb-1">④ ユーザーがアップロードした画像</p>
          <p className="ml-2">プロフィール画像等は、Cloudflare R2等の外部ストレージサービスに保存される場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">2. 利用目的</h2>
          <p className="mb-2">取得した情報は、以下の目的で利用します。</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>本サービスの提供、運営、保守のため</li>
            <li>ユーザーの識別、認証のため</li>
            <li>プロフィールページ、刻り記録、ランキング等を表示するため</li>
            <li>不正利用、スパム、荒らし行為等を防止するため</li>
            <li>利用状況の分析、サービス改善のため</li>
            <li>お問い合わせ対応のため</li>
            <li>重要なお知らせ、規約変更等の連絡のため</li>
            <li>法令または規約違反への対応のため</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">3. 公開される情報</h2>
          <p className="mb-2">本サービスの性質上、以下の情報は他のユーザーに表示される場合があります。</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>表示名</li>
            <li>プロフィール画像</li>
            <li>一言</li>
            <li>SNSリンク</li>
            <li>刻り記録</li>
            <li>連続日数</li>
            <li>総刻り数</li>
            <li>ランキング情報</li>
          </ol>
          <p className="mt-2">ユーザーは、本サービス上で公開される可能性のある情報について、自らの責任で登録するものとします。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">4. 第三者提供</h2>
          <p className="mb-2">運営者は、以下の場合を除き、取得した個人情報を第三者に提供しません。</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
            <li>本サービスの運営に必要な範囲で、外部サービスまたは業務委託先に情報を取り扱わせる場合</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">5. 外部サービスの利用</h2>
          <p className="mb-2">本サービスでは、以下の外部サービスを利用する場合があります。</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Googleログイン</li>
            <li>Cloudflare R2等の画像保存サービス</li>
            <li>アクセス解析サービス</li>
            <li>ホスティング、データベース、メール配信等のインフラサービス</li>
          </ol>
          <p className="mt-2">これらの外部サービスでは、各サービス提供者の規約およびプライバシーポリシーに基づき情報が取り扱われる場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">6. アクセス解析・Cookie等</h2>
          <p>本サービスでは、サービス改善や利用状況の把握のため、Cookieその他の技術を利用してアクセス情報を取得する場合があります。ユーザーは、ブラウザの設定によりCookieを無効化できます。ただし、一部機能が正常に利用できなくなる場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">7. 情報の管理</h2>
          <p>運営者は、取得した情報について、漏えい、滅失、改ざん、不正アクセス等を防止するため、必要かつ適切な安全管理措置を講じます。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">8. 情報の削除・退会</h2>
          <p>ユーザーは、本サービス内の退会機能または運営者が指定する方法により、アカウント削除を申請できます。退会により、運営者は当社所定の方法でユーザー情報を削除します。ただし、法令上保存が必要な情報、不正利用防止、トラブル対応、バックアップ等のために必要な情報については、一定期間保存される場合があります。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">9. プライバシーポリシーの変更</h2>
          <p>運営者は、必要に応じて本ポリシーを変更することがあります。変更後の内容は、本サービス上に掲載した時点で効力を生じるものとします。</p>
        </section>

        <section>
          <h2 className="font-bold text-slate-800 mb-2">10. お問い合わせ</h2>
          <p>本ポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームまたは運営者が指定する方法によりご連絡ください。</p>
        </section>
      </div>
    </div>
  );
}
