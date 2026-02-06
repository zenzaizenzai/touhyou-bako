// 状態管理
let stats = {
    'folded-right': 0,
    'folded-left': 0,
    'unfolded-right': 0,
    'unfolded-left': 0
};

let history = []; // Undo用の履歴 (直近1件のみ保持)

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
    const saved = localStorage.getItem('voting_stats');
    if (saved) {
        stats = JSON.parse(saved);
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
    stats[type]++;
    history.push(type);
    if (history.length > 1) history.shift(); // 1つだけ残す
    
    save();
    updateUI();
}

// Undo
function undo() {
    if (history.length === 0) return;
    
    const lastType = history.pop();
    if (stats[lastType] > 0) {
        stats[lastType]--;
    }
    
    save();
    updateUI();
}

// 保存
function save() {
    localStorage.setItem('voting_stats', JSON.stringify(stats));
}

// UI更新
function updateUI() {
    // 各ボタンの数値
    for (const key in stats) {
        elements[key].textContent = stats[key];
    }

    // 合計
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    elements.total.textContent = total;

    // 折りたたみ別
    elements['count-folded'].textContent = stats['folded-right'] + stats['folded-left'];
    elements['count-unfolded'].textContent = stats['unfolded-right'] + stats['unfolded-left'];

    // Undoボタンの状態
    elements.undoBtn.disabled = history.length === 0;
}

// リセット
function reset() {
    if (confirm('全てのデータをリセットしますか？')) {
        stats = {
            'folded-right': 0,
            'folded-left': 0,
            'unfolded-right': 0,
            'unfolded-left': 0
        };
        history = [];
        save();
        updateUI();
    }
}

// CSVエクスポート
function exportCSV() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += "項目,カウント\n";
    csvContent += `折って・右手,${stats['folded-right']}\n`;
    csvContent += `折って・左手,${stats['folded-left']}\n`;
    csvContent += `折らずに・右手,${stats['unfolded-right']}\n`;
    csvContent += `折らずに・左手,${stats['unfolded-left']}\n`;
    csvContent += `合計,${Object.values(stats).reduce((a, b) => a + b, 0)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `voting_report_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 実行
init();
