export const localCopy = {
  zh: { title: '启动本机项目', start: '启动本机项目', intro: '在当前电脑上启动并打开项目；首次使用需配置本机启动器。', setup: '首次配置说明', working: '正在准备启动…', sent: '启动链接已准备好。请点击下方“打开本机启动器”，再确认浏览器提示。', retry: '打开本机启动器 ↗', help: '点击上方“打开本机启动器”后才会请求打开应用。链接 60 秒内有效；若仍无反应，请查看配置说明。', error: '启动请求失败，请刷新页面或重新登录。', expired: '启动链接已过期，请重新点击启动。', instructions: '仅在安装了启动器并登记项目的电脑上使用。完成当前用户的协议注册后，返回项目页点击启动。浏览器可能提示打开本地应用，请自行确认。已运行的项目会直接打开；没有本地配置的项目会显示原因。', privacy: '项目目录和地址保存在本机，远程在线体验仍保持关闭。', access: '请使用管理员账号。', back: '返回项目', checking: '正在检查本机环境', docker: '正在启动 Docker Desktop', starting: '正在启动项目服务', waiting: '正在等待项目就绪', ready: '项目已就绪', open: '打开项目', failed: '项目未能启动', unchanged: '已有运行中的服务未被停止或重建。', not_configured: '此项目尚未配置本机启动，请联系本机配置维护者。', blocked: '此项目暂不接入本机启动。', ticket: '启动凭证无效、已使用或已过期。请从网站重新点击启动。', context: 'Docker 上下文与登记的本机环境不一致，已停止操作。', container: '容器身份或端口与登记配置不一致，需要更新本机配置。', unavailable: 'Docker Desktop 未就绪或当前账号无权访问，请先打开 Docker Desktop 检查。', health: '服务未在规定时间内就绪。请检查本机服务日志后重试。', busy: '已有启动任务正在进行，请稍后再试。', config: '本机启动器配置无效，请重新运行配置检查。', unknown: '启动失败，请查看本机启动记录。', partial: '本次已有程序或服务启动，失败后未自动停止，可能仍在运行。请检查对应应用或服务的运行状态。', setupSteps: ['在这台电脑上运行仓库中的 local-launcher/install.ps1，指定私有配置文件。', '安装脚本只登记当前用户的 yaqi-local 协议；不需要开放网络端口。', '返回项目页面点击“启动本机项目”，按浏览器提示打开启动器。'] },
  en: { title: 'Launch on this computer', start: 'Launch locally', intro: 'Start and open this project on this computer. Set up the local launcher first.', setup: 'First-time setup', working: 'Preparing launch…', sent: 'Launch link ready. Click Open local launcher below, then confirm the browser prompt.', retry: 'Open local launcher ↗', help: 'The app is requested only when you click Open local launcher. The link expires after 60 seconds. See setup if nothing happens.', error: 'Launch request failed. Refresh or sign in again.', expired: 'The launch link expired. Click Launch again.', instructions: 'Use a computer with the launcher installed and this project configured. Register the protocol for your Windows user, then return to the project. Your browser may ask permission to open the app. Running projects are reused; missing configurations show an explanation.', privacy: 'Project paths and addresses stay on this computer. Remote live access remains disabled.', access: 'Use an administrator account.', back: 'Back to project', checking: 'Checking this computer', docker: 'Starting Docker Desktop', starting: 'Starting project services', waiting: 'Waiting for the project', ready: 'Project ready', open: 'Open project', failed: 'Could not start project', unchanged: 'Existing running services were not stopped or rebuilt.', not_configured: 'This project has no local launch configuration.', blocked: 'Local launch is not enabled for this project.', ticket: 'Invalid, used or expired ticket. Launch again from the website.', context: 'The Docker context differs from the registered local environment.', container: 'Container identity or ports changed. Update local configuration.', unavailable: 'Docker Desktop is unavailable or access is denied. Check Docker Desktop.', health: 'Services did not become ready in time. Check local service logs.', busy: 'A launch is already in progress. Try again shortly.', config: 'Invalid local launcher configuration. Run the configuration check.', unknown: 'Launch failed. Check the local launch log.', partial: 'This request started programs or services that were not automatically stopped after the failure and may still be running. Check the relevant applications or services.', setupSteps: ['Run local-launcher/install.ps1 from the repository with your private configuration path.', 'The installer registers yaqi-local for the current Windows user only; no public port is needed.', 'Return to the project and click Launch locally. Accept the browser’s app prompt if desired.'] },
  ja: { title: 'このパソコンで起動', start: '本機で起動', intro: 'このパソコンで起動して開きます。初回は起動ツールの設定が必要です。', setup: '初回設定', working: '起動を準備中…', sent: '起動リンクを準備しました。下の「起動ツールを開く」をクリックし、ブラウザーの確認に対応してください。', retry: '起動ツールを開く', help: '下のリンクをクリックして起動します。60秒以内に操作してください。反応がない場合は設定手順をご覧ください。', error: '起動要求に失敗しました。再読み込みまたは再ログインしてください。', expired: 'リンクの期限が切れました。もう一度起動してください。', instructions: '起動ツールとプロジェクト設定があるパソコンで利用してください。ユーザー用のプロトコルを登録してからプロジェクトへ戻ります。ブラウザーの確認が表示される場合があります。実行中のサービスは再利用し、未設定の場合は理由を表示します。', privacy: 'パスとアドレスは本機に保存されます。リモート体験は無効のままです。', access: '管理者アカウントでログインしてください。', back: 'プロジェクトに戻る', checking: '環境を確認中', docker: 'Docker Desktop を起動中', starting: 'サービスを起動中', waiting: '準備完了を待っています', ready: '準備完了', open: 'プロジェクトを開く', failed: '起動できませんでした', unchanged: '実行中のサービスは停止・再作成していません。', not_configured: '本機の起動設定がありません。', blocked: 'このプロジェクトの本機起動は対象外です。', ticket: '無効・使用済み・期限切れの起動情報です。サイトから再度起動してください。', context: 'Docker の接続先が登録済みの本機環境と異なります。', container: 'コンテナーの識別情報またはポートが変更されています。', unavailable: 'Docker Desktop を開き、準備状態とアクセス権を確認してください。', health: '準備が時間内に完了しませんでした。サービスログを確認してください。', busy: '起動処理が進行中です。しばらくお待ちください。', config: '本機設定が無効です。設定チェックを実行してください。', unknown: '起動に失敗しました。本機の記録を確認してください。', partial: '今回起動したプログラムやサービスは、失敗後も自動停止されず、動作している可能性があります。該当するアプリやサービスの状態を確認してください。', setupSteps: ['リポジトリーの local-launcher/install.ps1 に私有設定ファイルを指定して実行します。', '現在の Windows ユーザーにのみ yaqi-local を登録します。公開ポートは不要です。', 'プロジェクトページに戻って起動し、ブラウザーの確認に対応してください。'] },
  fr: { title: 'Lancer sur cet ordinateur', start: 'Lancer localement', intro: 'Démarrez et ouvrez le projet sur cet ordinateur. Configurez le lanceur au préalable.', setup: 'Première configuration', working: 'Préparation du lancement…', sent: 'Le lien est prêt. Cliquez sur Ouvrir le lanceur, puis confirmez dans le navigateur.', retry: 'Ouvrir le lanceur', help: 'Cliquez sur Ouvrir le lanceur pour demander le lancement. Le lien expire après 60 secondes. Consultez la configuration si rien ne se passe.', error: 'Échec de la demande. Actualisez ou reconnectez-vous.', expired: 'Le lien a expiré. Relancez la demande.', instructions: 'Utilisez un ordinateur équipé du lanceur et de la configuration du projet. Enregistrez le protocole pour votre utilisateur Windows, puis revenez au projet. Le navigateur peut demander confirmation. Les services actifs sont réutilisés ; une configuration manquante est signalée.', privacy: 'Les chemins et adresses restent sur cet ordinateur. L’accès distant reste désactivé.', access: 'Connectez-vous avec un compte administrateur.', back: 'Retour au projet', checking: 'Vérification de l’environnement', docker: 'Démarrage de Docker Desktop', starting: 'Démarrage des services', waiting: 'Attente du projet', ready: 'Projet prêt', open: 'Ouvrir le projet', failed: 'Le projet n’a pas démarré', unchanged: 'Les services actifs n’ont pas été arrêtés ni reconstruits.', not_configured: 'Ce projet n’a pas de configuration locale.', blocked: 'Le lancement local est indisponible pour ce projet.', ticket: 'Autorisation invalide, utilisée ou expirée. Relancez depuis le site.', context: 'Le contexte Docker ne correspond pas à l’environnement local enregistré.', container: 'L’identité ou les ports du conteneur ont changé. Actualisez la configuration.', unavailable: 'Docker Desktop est indisponible ou l’accès est refusé. Vérifiez son état.', health: 'Les services ne sont pas prêts dans le délai prévu. Consultez leurs journaux.', busy: 'Un lancement est déjà en cours. Réessayez bientôt.', config: 'Configuration locale invalide. Exécutez sa vérification.', unknown: 'Échec du lancement. Consultez le journal local.', partial: 'Des programmes ou services ont été lancés sans être arrêtés automatiquement après l’échec. Ils peuvent encore fonctionner. Vérifiez les applications ou services concernés.', setupSteps: ['Exécutez local-launcher/install.ps1 du dépôt avec le chemin de votre configuration privée.', 'Le script enregistre yaqi-local uniquement pour l’utilisateur Windows actuel, sans port public.', 'Revenez au projet et lancez-le localement. Répondez à la confirmation du navigateur.'] },
};

// Labels shared by the portal and local progress window.
const runtimeCopy = {
  "zh": {
    "artifact": "本机程序或文件已变更，请重新核验启动配置。",
    "process": "本机程序未能正常运行，请检查其运行环境。",
    "device": "指定模拟器或应用尚未就绪，请先完成本机配置。",
    "emulator": "正在启动 Android 模拟器",
    "kinds": {
      "web": "启动网页项目",
      "desktop": "打开桌面应用",
      "android": "打开 Android 演示",
      "sample": "运行本地样例",
      "document": "查看研究资料"
    }
  },
  "en": {
    "artifact": "A local program or file changed. Review its launch configuration.",
    "process": "The local program could not run. Check its runtime.",
    "device": "The configured emulator or app is not ready. Complete local setup first.",
    "emulator": "Starting the Android emulator",
    "kinds": {
      "web": "Start web project",
      "desktop": "Open desktop app",
      "android": "Open Android demo",
      "sample": "Run local sample",
      "document": "View research materials"
    }
  },
  "ja": {
    "artifact": "本機のプログラムまたはファイルが変更されています。設定を再確認してください。",
    "process": "本機のプログラムを実行できません。実行環境を確認してください。",
    "device": "指定のエミュレーターまたはアプリの準備ができていません。",
    "emulator": "Android エミュレーターを起動中",
    "kinds": {
      "web": "Web プロジェクトを起動",
      "desktop": "デスクトップアプリを開く",
      "android": "Android デモを開く",
      "sample": "ローカル例を実行",
      "document": "研究資料を見る"
    }
  },
  "fr": {
    "artifact": "Un programme ou fichier local a changé. Vérifiez sa configuration.",
    "process": "Le programme local ne fonctionne pas. Vérifiez son environnement.",
    "device": "L’émulateur ou l’application configurée n’est pas prêt.",
    "emulator": "Démarrage de l’émulateur Android",
    "kinds": {
      "web": "Démarrer le projet web",
      "desktop": "Ouvrir l’application",
      "android": "Ouvrir la démo Android",
      "sample": "Exécuter un exemple",
      "document": "Consulter les documents"
    }
  }
};
for (const lang of Object.keys(runtimeCopy)) Object.assign(localCopy[lang], runtimeCopy[lang]);
