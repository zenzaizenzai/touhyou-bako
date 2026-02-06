// 状態管理
let data = {
    summary: {
        'folded-right': 0,
        'folded-left': 0,
        'unfolded-right': 0,
        'unfolded-left': 0
    },
    logs: [] // [{t: timestamp, type: type}, ...] 
};

// DOM要素の取得
const elements = {
    'folded-right': document.getElementById('val-folded-right'),
    'folded-left': document.getElementById('val-folded-left'),
    'unfolded-right': document.getElementById('val-unfolded-right'),
    'unfolded-left': document.getElementById('val-unfolded-left'),
    'total': document.getElementById('total'),
    'count-folded': document.getElementById('count-folded'),
    'count-unfolded': document.getElementById('count-unfolded'),
    'undoBtn': document.getElementById('btn-undo')
};

// 初期化
function init() {
    const saved = localStorage.getItem('voting_data');
    if (saved) {
        data = JSON.parse(saved);
        updateUI();
    }

    // イベントリスナーの登録
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            increment(type);

            // 視覚的フィードバック（フラッシュ）
            btn.classList.remove('flash');
            void btn.offsetWidth; // リフロー
            btn.classList.add('flash');
        });
    });

    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-export').addEventListener('click', exportCSV);
    document.getElementById('btn-reset').addEventListener('click', reset);
}

// カウントアップ
function increment(type) {
    data.summary[type]++;
    data.logs.push({
        t: Date.now(),
        type: type
    });

    save();
    updateUI();
}

// Undo
function undo() {
    if (data.logs.length === 0) return;

    const lastLog = data.logs.pop();
    const type = lastLog.type;

    if (data.summary[type] > 0) {
        data.summary[type]--;
    }

    save();
    updateUI();
}

// 保存
function save() {
    localStorage.setItem('voting_data', JSON.stringify(data));
}

// UI更新
function updateUI() {
    // 各ボタンの数値
    for (const key in data.summary) {
        elements[key].textContent = data.summary[key];
    }

    // 合計
    const total = Object.values(data.summary).reduce((a, b) => a + b, 0);
    elements.total.textContent = total;

    // 折りたたみ別
    elements['count-folded'].textContent = data.summary['folded-right'] + data.summary['folded-left'];
    elements['count-unfolded'].textContent = data.summary['unfolded-right'] + data.summary['unfolded-left'];

    // Undoボタンの状態
    elements.undoBtn.disabled = data.logs.length === 0;
}

// リセット
function reset() {
    if (confirm('全てのデータ（履歴含む）をリセットしますか？')) {
        data = {
            summary: {
                'folded-right': 0,
                'folded-left': 0,
                'unfolded-right': 0,
                'unfolded-left': 0
            },
            logs: []
        };
        save();
        updateUI();
    }
}

// CSVエクスポート
function exportCSV() {
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel

    // サマリー部分
    csvContent += "--- サマリー ---\n";
    csvContent += "項目,カウント\n";
    csvContent += `折って・右手,${data.summary['folded-right']}\n`;
    csvContent += `折って・左手,${data.summary['folded-left']}\n`;
    csvContent += `折らずに・右手,${data.summary['unfolded-right']}\n`;
    csvContent += `折らずに・左手,${data.summary['unfolded-left']}\n`;
    csvContent += `合計,${Object.values(data.summary).reduce((a, b) => a + b, 0)}\n\n`;

    // ログ（タイムスタンプ）部分
    csvContent += "--- 時系列ログ ---\n";
    csvContent += "時刻,カテゴリ,UnixTime(ms)\n";

    data.logs.forEach(log => {
        const d = new Date(log.t);
        const timeStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
        csvContent += `${timeStr},${log.type},${log.t}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `voting_log_${timestampStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 実行
init();
